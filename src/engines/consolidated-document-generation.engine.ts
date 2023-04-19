import Bluebird from 'bluebird';
import _ from 'underscore';
import {injectable, BindingScope, inject} from '@loopback/core';
import {
  ConsolidatedDocumentRepository,
  ContainerUtils,
  IStorageService,
  Option,
  TransactionFeedLogRepository,
  KarvyAnnexureFeedRepository,
  KarvyAnnexureFeed,
  Account,
  AccountRepository,
  RestError,
  UserManagementAppFile,
  FileStorageContainerConfig,
  LoggingUtils,
  UserManagementAppFileRepository,
  OrderItem,
  OrderItemRepository,
  Order,
  OrderRepository
} from 'common';
import {Options, repository} from '@loopback/repository';
import JSZip from 'jszip';
import moment from 'moment';
import AppConstant from 'common/dist/constants/app-constant';
const dbf = require('dbf');
var PDFImage = require('pdf-image').PDFImage;
import path from 'path';
import fs from 'fs';
import {promisify} from 'util';
const readFile = promisify(fs.readFile);
import * as fsExtra from 'fs-extra';
import { OverseesAddressRepository } from 'common';
const CAMS_ARN = 'ARN-0005';
@injectable({scope: BindingScope.APPLICATION})
export class ConsolidatedDocumentGenerationEngine {
  constructor(
    @repository(ConsolidatedDocumentRepository) private consolidatedDocumentRepository: ConsolidatedDocumentRepository,
    @repository(TransactionFeedLogRepository) private transactionFeedLogRepository: TransactionFeedLogRepository,
    @repository(KarvyAnnexureFeedRepository) private karvyAnnexureFeedRepository: KarvyAnnexureFeedRepository,
    @repository(AccountRepository) private accountRepository: AccountRepository,
    @repository(OrderItemRepository) private orderItemRepository: OrderItemRepository,
    @inject('services.fileStorageComponent')
    private fileStorageService: IStorageService,
    @repository(UserManagementAppFileRepository) private userManagementAppFileRepository: UserManagementAppFileRepository,
    @repository(OrderRepository) private orderRepository: OrderRepository
  ) {}

  async generateZipForDocuments(accountIds: Array<number>, rtaId: number, options: Options) {
    const methodName = 'generateZipForDocuments';
    return new Promise((resolve, reject) => {
      let accounts: Account[], zip: any;
      const accountWisetiffFiles: any = [];
      let zipPath = '';
      let accountZipFolderName: any, accountWiseZipFolder: any, zipContainerFileName: any;
      LoggingUtils.debug('1 fetching records and files', methodName);
      let orderData: Array<Order> = [];
      this.orderRepository.find({
        where: {
          accountId: {
            inq: accountIds
          },
          isActive: true
        }
      }, options)
      .then((data : Array<Order>)=>{
        orderData = data;
        return this.orderItemRepository
        .find(
          {
            where: {
              rtaId: rtaId,
              txnFeedLogId: {
                neq: null
              }
            }
          },
          options
        )
      })
        .then((orderItems: Array<OrderItem>) => {
          if (!orderItems || !orderItems.length) {
            LoggingUtils.debug('No orders found for accounts! ', methodName);
            // add logs
            return reject({success: false});
          }

          LoggingUtils.debug('Fetched records order item', methodName);
          let accountIds: Array<number> = [];
          let uniqAccountIds: Array<number> = [];
          orderItems.forEach(oiData => {
            let relavantOrder = _.find(orderData, ele => { return oiData.orderId === ele.id });
            if (oiData.orderId && relavantOrder && relavantOrder.id && relavantOrder.accountId) {
              accountIds.push(relavantOrder.accountId);
            }
          });
          return (uniqAccountIds = _.uniq(accountIds));
        })
        .then(uniqAccountIds => {
          if (!uniqAccountIds || !uniqAccountIds.length) {
            LoggingUtils.debug('No account found! ', methodName);
            return reject(new RestError(400, `{success: false}`));
          }
          this.accountRepository
            .find(
              {
                where: {
                  id: {
                    inq: uniqAccountIds
                  }
                },
                include: [
                  {
                    relation: 'accountAppFileMapping',
                    scope: {
                      where: {
                        isActive: true
                      },
                      include: [
                        {
                          relation: 'userManagementAppFile'
                        }
                      ]
                    }
                  },
                  {
                    relation: 'primaryHolder',
                    scope: {
                      include: [
                        {
                          relation: 'investorDetails'
                        }
                      ]
                    }
                  },
                  {
                    relation: 'secondaryHolder',
                    scope: {
                      include: [
                        {
                          relation: 'investorDetails'
                        }
                      ]
                    }
                  },
                  {
                    relation: 'tertiaryHolder',
                    scope: {
                      include: [
                        {
                          relation: 'investorDetails'
                        }
                      ]
                    }
                  },
                  {
                    relation: 'bankAccounts',
                    scope: {
                      where: {
                        accountId: {
                          inq: uniqAccountIds
                        },
                        isActive: true
                      },
                      include: [
                        // {
                        //   relation: 'chequeImageFile'
                        // },
                        {
                          relation: 'bankBranch',
                          scope: {
                            include: [
                              {
                                relation: 'bank'
                              }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ]
              },
              options
            )
            //--- fetching details from consolidated dcouments
            .then(accountInstances => {
              accounts = accountInstances;
              if (accountInstances.length === 0) {
                LoggingUtils.debug('2 no records and files found', methodName);
                Promise.reject(new RestError(400, `Accounts Details not found !`, {systemcode : 1368}));
              }
              return Bluebird.map(accountInstances, (accountDetails, index) => {
                LoggingUtils.debug('3 fetching files', methodName);
                if (
                  !accountDetails.primaryHolder &&
                  !accountDetails.primaryHolder.name &&
                  !accountDetails.primaryHolder.investorDetails &&
                  !accountDetails.primaryHolder.investorDetails.panCardNumber
                ) {
                  LoggingUtils.debug('4 no files', methodName);
                  return Promise.resolve();
                } else {
                  if (accountDetails && accountDetails.accountAppFileMapping && accountDetails.accountAppFileMapping.length !== 0) {
                    LoggingUtils.debug('5 account app file present', methodName);
                    const userManagementAppFile = accountDetails?.accountAppFileMapping[0]?.userManagementAppFile;
                    if (userManagementAppFile) {
                      LoggingUtils.debug('6 returning files ', methodName);
                      return userManagementAppFile;
                    }
                  }
                }
              });
            })
            // ---- getting list of file
            .then((generatedAPPFiles: UserManagementAppFile[]) => {
              if (generatedAPPFiles && generatedAPPFiles.length <= 0) {
                LoggingUtils.debug('7 files not found ', methodName);
                Promise.reject(new RestError(400, 'App File not generated !', {systemcode : 1369}));
              }
              LoggingUtils.debug('8 generating files ', methodName);
              let files: any = [];
              _.each(generatedAPPFiles, (file, index) => {
                const currentAcccountFiles = [];
                currentAcccountFiles.push(file);
                files.push(currentAcccountFiles);
              });
              return Promise.resolve(files);
            })
            //---- processing processing files
            .then(allAccountsDocumentsTobeUploaded => {
              LoggingUtils.debug('9 downloading files to server ', methodName);
              return Bluebird.map(allAccountsDocumentsTobeUploaded, (documentsTobeUploaded: any) => {
                return Bluebird.map(documentsTobeUploaded, (document: any) => {
                  let downloadPath = path.resolve(__dirname, '../../.temp/', document.name);
                  return ContainerUtils.downloadFileToServer(this.fileStorageService, document.containerName, document.name, downloadPath);
                });
              });
            })
            //--- downloading file to service .temp
            .then(async accountWiseDownloadedFiles => {
              const promises: any = [];
              for (let downloadedFiles of accountWiseDownloadedFiles) {
                if (downloadedFiles.length < 0) {
                  LoggingUtils.debug('10 files not downloaded ', methodName);
                  Promise.reject(new RestError(400, `Files not downloaded`, {systemcode : 1370}));
                }

                let fileExtention = path.extname(downloadedFiles[0]);
                LoggingUtils.debug('11 extarcting file extension ', methodName);
                if (fileExtention !== '.tif') {
                  LoggingUtils.debug('12 converting to tiff ', methodName);
                  let pdfImage = new PDFImage(downloadedFiles[0], {
                    combinedImage: true,
                    adjoinImage: true,
                    convertExtension: 'tiff',
                    graphicsMagick: true,
                    convertOptions: {
                      '-colorspace': 'Gray',
                      '-type': 'grayscale',
                      '-quality': '100',
                      '-density': '200',
                      '-compress': 'LZW',
                      '-depth': '4',
                      '-units': 'PixelsPerInch'
                    }
                  });
                  promises.push(Promise.resolve(pdfImage.convertFile()));
                } else {
                  promises.push(Promise.resolve(null));
                }
              }
              return Promise.all(promises).then(values => {
                LoggingUtils.debug('13 files converted ', methodName);
                return values;
              });
            })
            //--- conversion of file from pdf to tiff
            .then(accountWiseTiffFilesArr => {
              LoggingUtils.debug('14 mapping tiff files with acc ', methodName);
              _.each(accountWiseTiffFilesArr, (tiffFilesArr, index) => {
                const accountDetails = accounts[index];
                accountWisetiffFiles.push(tiffFilesArr);
              });
              LoggingUtils.debug('15 resolving  accountwiseTiffArr', methodName);
              return Promise.resolve(accountWiseTiffFilesArr);
            })
            // ----  mapping tiff with account and pushing to global.
            .then(() => {
              LoggingUtils.debug('16 fetching from karvyAnexxurefeed ', methodName);
              return this.karvyAnnexureFeedRepository.findOne(
                {
                  where : {
                  and: [
                    {
                      createdDate: {
                        gte: moment().startOf('day')
                      }
                    },
                    {
                      createdDate: {
                        lte: moment().endOf('day')
                      }
                    }
                  ]
                  },
                  order: ['id DESC'],
                  limit: 1
                },
                options
              );
            })
            // fatch batch and sequence for karvay and annexure
            .then(async latestRecordKarvyAnnexure => {
              LoggingUtils.debug('17 calculating batch and sequence ', methodName);
              const nextBatchNumber = ((latestRecordKarvyAnnexure || {}).batchNumber || 0) + 1;
              let nextBatchSequenceNumber = 0;//(latestRecordKarvyAnnexure || {}).batchSequenceNumber || 0;
              const karvyAnnexureFeedData: KarvyAnnexureFeed[] = [];
              zip = new JSZip();
              const zipFiles = [];
              const karvyDbFileData: any = [];
              LoggingUtils.debug('18 data collection for DFB files ', methodName);
              let index = -1;
              for (const accountDetails of accounts) {
                index = index + 1;
                // }
                // _.each(accounts, (accountDetails, index) => {
                const pancardHolders = [];
                if (accountDetails.primaryHolder && accountDetails.primaryHolder.investorDetails.panCardNumber) {
                  pancardHolders.push({type : '1', data : accountDetails.primaryHolder});
                }
                if (accountDetails.secondaryHolder && accountDetails.secondaryHolder.investorDetails.panCardNumber) {
                  pancardHolders.push({type : '2', data : accountDetails.secondaryHolder});
                }
                if (accountDetails.tertiaryHolder && accountDetails.tertiaryHolder.investorDetails.panCardNumber) {
                  pancardHolders.push({type : '3', data : accountDetails.tertiaryHolder});
                }
                let accIndex = -1;
                for (const itempancardHolders of pancardHolders) {
                  const accountHolder = itempancardHolders.data
                  accIndex = accIndex + 1;
                  // _.each(pancardHolders, async (accountHolder, accIndex) => {
                  const panCardNumber = accountHolder.investorDetails.panCardNumber;
                  const investorId = String(accountDetails.uniqueId).padStart(12, '0') ;
                  nextBatchSequenceNumber++;
                  const karvyAnnexure: any = {
                    batchNumber: nextBatchNumber,
                    batchSequenceNumber: nextBatchSequenceNumber,
                    accountId: accountDetails?.id!
                  };
                  karvyAnnexureFeedData.push(karvyAnnexure);
                  function toBuffer(ab: any) {
                    var buffer = Buffer.from(ab);
                    var view = new Uint8Array(ab);
                    for (var i = 0; i < buffer.length; ++i) {
                      buffer[i] = view[i];
                    }
                    return buffer;
                  }
                  if (rtaId === AppConstant.RTA_KARVY) {
                    accountZipFolderName = `INA${AppConstant.RTA_DOC_KFINTECH}${moment().format(
                      'YYYYMMDD'
                    )}_${panCardNumber}_${nextBatchNumber}`;
                    //accountWiseZipFolder = await zip.folder(accountZipFolderName);
                    //zipContainerFileName = `DOC_${AppConstant.ARN_RIA}${moment().format('DDMMYYYY')}`;
                    zipContainerFileName = `0005${moment().format('DDMMYY')}${String(nextBatchNumber).padStart(3, '0')}`;
                    let requiredFileds = {
                      FIELD1: `${moment().format('DDMMYY')}${String(nextBatchNumber).padStart(3, '0')}`,
                      FIELD2: `${moment().format('DDMMYY')}${String(nextBatchNumber).padStart(3, '0')}${nextBatchSequenceNumber}`,
                      FIELD3: `0005${investorId}`,
                      FIELD4: '',
                      FIELD5: AppConstant.BROKER_CODE,
                      FIELD6: `${AppConstant.ARN_RIA}`,
                      FIELD7: '',
                      FIELD8: '',
                      FIELD9: accountHolder.name,
                      FIELD10: itempancardHolders.type,
                      FIELD11: 'N',
                      FIELD12: 'ON',
                      FIELD13: 'AOF',
                      FIELD14: panCardNumber,
                      FIELD15: investorId,
                      FIELD16: 'N'
                    };
                    LoggingUtils.debug(requiredFileds, 'generateZipForDocuments');
                    karvyDbFileData.push(requiredFileds);
                    if (index === accounts.length - 1) {
                      LoggingUtils.debug('19 dbf file created ', methodName);
                      var buff = await dbf.structure(karvyDbFileData);
                      await zip.file(`DOC_ARN0005${moment().format('DDMMYYYY')}.dbf`, toBuffer(buff.buffer));
                      zipPath = await path.resolve(__dirname, '../../.temp/', zipContainerFileName);
                      await this.karvyAnnexureFeedRepository.createAll(karvyAnnexureFeedData, options).catch(err => {
                        LoggingUtils.error(err);
                        // throw new Error(err);
                      });
                    }
                  } else if (rtaId === AppConstant.RTA_CAMS) {
                    accountZipFolderName = `INV_${moment().format('YYYYMMDD')}_${panCardNumber}`;
                    accountWiseZipFolder = zip.folder(accountZipFolderName);
                    //zipContainerFileName = `Text_${AppConstant.ARN_RIA}${moment().format('DDMMYYYY')}`;
                    zipContainerFileName = `DOC_${AppConstant.RTA_DOC_CAMS}_${moment().format('DDMMYYYYHHmmss')}`;
                    let requiredFileds = {
                      FIELD1: CAMS_ARN,
                      FIELD2: panCardNumber,
                      FIELD3: accountHolder.name,
                      FIELD4: 'ALL',
                      FIELD5: `${CAMS_ARN}$${panCardNumber}$ALL`,
                      FIELD6: ''
                    };
                    let documentName = `Text_${moment().format('YYYYMMDD')}_${panCardNumber}`;
                    var buff = dbf.structure([requiredFileds]);
                    zipPath = path.resolve(__dirname, '../../.temp/', zipContainerFileName);
                    accountWiseZipFolder.file(documentName + `.dbf`, toBuffer(buff.buffer));
                  }
                  LoggingUtils.debug('20 reading tiff files ', methodName);
                  const tiffFiles = accountWisetiffFiles[index];
                  let fileName =
                    rtaId === 1
                      ? `0005${investorId}.tif`
                      : rtaId === 2
                      ? `${CAMS_ARN}$${panCardNumber}$ALL.tif`
                      : '';

                  let filesData = await fs.readFileSync(tiffFiles);
                  if (rtaId === AppConstant.RTA_KARVY){
                    await zip.file(fileName, filesData);
                  }else{

                    await accountWiseZipFolder.file(fileName, filesData);
                  }
                }
              }
              return true;
            })
            .then(() => {
              zip
                .generateNodeStream({type: 'nodebuffer', streamFiles: true})
                .pipe(fs.createWriteStream(zipPath + '.zip'))
                .on('finish', async () => {
                  const containerFileName = zipContainerFileName + `.zip`;
                  const inputFilePath = path.resolve(__dirname, `../../.temp/${containerFileName}`);
                  LoggingUtils.debug('22 uploading to container ', methodName);
                  const zipUploaded: any = await ContainerUtils.uploadFileFromServer(
                    this.fileStorageService,
                    FileStorageContainerConfig.getGcpContainerName('rtaZipDoc'),
                    containerFileName,
                    inputFilePath
                  );
                  this.fileStorageService.getFile(
                    FileStorageContainerConfig.getGcpContainerName('rtaZipDoc'),
                    containerFileName,
                    async (err, reply) => {
                      if (err) {
                        reject(err);
                      }
                      LoggingUtils.debug('Logging User Management AppFile', reply);
                      let fileObj = {
                        containerName: FileStorageContainerConfig.getGcpContainerName('rtaZipDoc'),
                        path: reply.name,
                        originalFileName: reply.name,
                        name: reply.name,
                        size: reply.size,
                        extension: 'zip',
                        mimeType: 'application/zip',
                        checksum: zipUploaded.checksum
                      };
                      const zipFile = await this.userManagementAppFileRepository.create(fileObj, options);
                      LoggingUtils.debug('24 app file entry done ', methodName);
                      await this.consolidatedDocumentRepository.updateAll(
                        {status: Option.GLOBALOPTIONS.CONSOLIDATEDDOCUMENTSTATUS.generated.value,
                          generatedDate: new Date(),
                          appFileId: zipFile.id},
                        {
                          isActive: true,
                          accountId: {
                            inq: accountIds
                          },
                          rtaId: rtaId
                        },
                        options
                      );
                    }
                  );
                  LoggingUtils.debug('zip written.');
                  LoggingUtils.debug('23 unkink tmp files ', methodName);
                  fsExtra.emptyDirSync(path.resolve(__dirname, `../../.temp/`));
                  return Promise.resolve();
                });
            })
            .catch((error: Error) => {
              LoggingUtils.error(error, methodName);
              return reject(error);
            });
        })
        .then(data => {
          return resolve({success: true});
        })
        .catch((error: Error) => {
          console.trace(error);
          LoggingUtils.error(error.message, methodName);
          return reject(error);
        });
    });
  }
}
