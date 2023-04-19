import Bluebird, {reject, resolve} from 'bluebird';
import _ from 'underscore';
import {injectable, BindingScope, inject} from '@loopback/core';
import {
  NomineeDocumentRepository,
  ContainerUtils,
  IStorageService,
  Option,
  TransactionFeedLogRepository,
  Account,
  AccountRepository,
  RestError,
  UserManagementAppFile,
  FileStorageContainerConfig,
  LoggingUtils,
  UserManagementAppFileRepository,
  OrderItem,
  OrderItemRepository,
  TransactionFeedLog,
  NomineeDocument
} from 'common';
import {Options, repository} from '@loopback/repository';
import JSZip from 'jszip';
import moment from 'moment-timezone';
import AppConstant from 'common/dist/constants/app-constant';
var PDFImage = require('pdf-image').PDFImage;
import path from 'path';
import fs from 'fs';
import * as fsExtra from 'fs-extra';
import {DBFFile} from 'dbffile';
@injectable({scope: BindingScope.APPLICATION})
export class NomineeDocumentGenerationEngine {
  constructor(
    @repository(NomineeDocumentRepository) private nomineeDocumentRepository: NomineeDocumentRepository,
    @repository(TransactionFeedLogRepository) private transactionFeedLogRepository: TransactionFeedLogRepository,
    @repository(AccountRepository) private accountRepository: AccountRepository,
    @repository(OrderItemRepository) private orderItemRepository: OrderItemRepository,
    @inject('services.fileStorageComponent')
    private fileStorageService: IStorageService,
    @repository(UserManagementAppFileRepository) private userManagementAppFileRepository: UserManagementAppFileRepository
  ) {}

  async generateZipForNomineeDocuments(obj: any, options: Options): Promise<any> {
    const methodName = 'generateZipForDocuments';
    // return new Promise((resolve, reject) => {
    return new Promise(async (resolve, reject) => {
      // resolve({})
      let startDate = obj.date ? moment(new Date(obj.date)).startOf('day') :moment().startOf('day')
      let endDate = obj.date ? moment(new Date(obj.date)).endOf('day') :moment().endOf('day')


      LoggingUtils.debug('1 fetching records and files', methodName);
      const transactionFeedLogWhere: any = {
        and: [
          {
            generatedDate: {
              gte: startDate
            }
          },
          {
            generatedDate: {
              lte: endDate
            }
          }
        ]
      };
      if (obj.rtaId) {
        transactionFeedLogWhere.rtaId = obj.rtaId;
      }
      this.transactionFeedLogRepository
        .find(
          {
            where: transactionFeedLogWhere,
            include: [
              {
                relation: 'orderItems',
                scope: {
                  include: [
                    {
                      relation: 'paymentDetails',
                      scope: {
                        where: {
                          paymentStatus: {
                            inq: [
                              Option.GLOBALOPTIONS.PAYMENTSTATUS.successful.value, //@todo - check this in context of delta app
                              Option.GLOBALOPTIONS.PAYMENTSTATUS.sentToPG.value,
                              Option.GLOBALOPTIONS.PAYMENTSTATUS.fundsSettled.value //to include transactions settled on 2nd and 4th Saturday
                            ]
                          }
                        },
                        include: [
                          {
                            relation: 'bankAccount',
                            scope: {
                              include: [
                                {
                                  relation: 'bankBranch',
                                  scope: {
                                    include: [
                                      {
                                        relation: 'bank'
                                      },
                                      {
                                        relation: 'address'
                                      }
                                    ]
                                  }
                                },
                                {
                                  relation: 'bankAccountType'
                                },
                                {
                                  relation: 'holdingType'
                                }
                              ]
                            }
                          }
                        ]
                      }
                    },
                    {relation: 'transaction'},
                    {relation: 'systematicMethod'},
                    {relation: 'serviceProviderAccount'},
                    {relation: 'transactionType'},
                    {
                      relation: 'instrument',
                      scope: {
                        where: obj.serviceProviderId ? {serviceProviderId: obj.serviceProviderId} : {},
                        include: [
                          {
                            relation: 'serviceProvider',
                            scope: {
                              include: [
                                {
                                  relation: 'bankBranch',
                                  scope: {
                                    include: [{relation: 'bank'}]
                                  }
                                },
                                {
                                  relation: 'rta'
                                }
                              ]
                            }
                          },
                          {relation: 'mutualFundDetails'}
                        ]
                      }
                    },
                    {
                      relation: 'secondaryInstrument',
                      scope: {
                        include: [
                          {
                            relation: 'serviceProvider'
                          },
                          {relation: 'mutualFundDetails'}
                        ]
                      }
                    },
                    {
                      relation: 'order',
                      scope: {
                        where: {
                          isActive: true
                        },
                        include: [
                          {
                            relation: 'account',
                            scope: {
                              where: obj.accountId ? {id: obj.accountId} : {},
                              include: [
                                {
                                  relation: 'bankAccounts',
                                  scope: {
                                    where: {
                                      isDefault: true //@todo - need to check this wrt Delta app
                                    },
                                    include: [
                                      {
                                        relation: 'bankAccountType'
                                      },
                                      {
                                        relation: 'bankBranch', //@todo - need to check this wrt Delta app
                                        scope: {
                                          include: [
                                            {
                                              relation: 'bank'
                                            },
                                            {
                                              relation: 'address' //@todo - need to check this wrt Delta app
                                            }
                                          ]
                                        }
                                      },
                                      {
                                        relation: 'holdingType'
                                      }
                                    ]
                                  }
                                },
                                {
                                  relation: 'primaryHolder',
                                  scope: {
                                    include: [
                                      {
                                        relation: 'investorDetails',
                                        scope: {
                                          include: [
                                            {
                                              relation: 'permanentAddress',
                                              scope: {
                                                include: [{relation: 'state'}]
                                              }
                                            },
                                            {
                                              relation: 'overseesAddress',
                                              scope: {
                                                include: [{relation: 'country'}]
                                              }
                                            },
                                            {relation: 'occupation'},
                                            {relation: 'politicallyExposureType'},
                                            {relation: 'incomeSlab'},
                                            {relation: 'investorType'}
                                          ]
                                        }
                                      }
                                    ]
                                  }
                                },
                                {
                                  relation: 'secondaryHolder',
                                  scope: {
                                    include: [
                                      {
                                        relation: 'investorDetails',
                                        scope: {
                                          include: [{relation: 'politicallyExposureType'}, {relation: 'incomeSlab'}]
                                        }
                                      }
                                    ]
                                  }
                                },
                                {
                                  relation: 'tertiaryHolder',
                                  scope: {
                                    include: [
                                      {
                                        relation: 'investorDetails',
                                        scope: {
                                          include: [{relation: 'politicallyExposureType'}, {relation: 'incomeSlab'}]
                                        }
                                      }
                                    ]
                                  }
                                },
                                {
                                  relation: 'primaryNominee',
                                  scope: {
                                    include: [{relation: 'investorDetails'}]
                                  }
                                },
                                {relation: 'secondaryNominee'},
                                {relation: 'tertiaryNominee'},
                                {
                                  relation: 'nomineeGuardian',
                                  scope: {
                                    include: [
                                      {
                                        relation: 'investorDetails',
                                        scope: {
                                          include: [{relation: 'investorType'}]
                                        }
                                      }
                                    ]
                                  }
                                },

                                {
                                  relation: 'guardian',
                                  scope: {
                                    include: [
                                      {
                                        relation: 'investorDetails',
                                        scope: {
                                          include: [{relation: 'politicallyExposureType'}, {relation: 'incomeSlab'}]
                                        }
                                      }
                                    ]
                                  }
                                },
                                {relation: 'primaryNomineeRelationship'},
                                {relation: 'secondaryNomineeRelationship'},
                                {relation: 'tertiaryNomineeRelationship'},
                                {relation: 'guardianRelationship'},
                                //{relation: 'nomineeGuardianRelationship'}, // not working
                                {relation: 'holdingType'},
                                {relation: 'distributor'},
                                {
                                  relation: 'investorNominees',
                                  scope: {
                                    include: [
                                      {
                                        relation: 'appUser',
                                        scope: {
                                          include: [
                                            {
                                              relation: 'investorDetails'
                                            }
                                          ]
                                        }
                                      },
                                      {
                                        relation: 'relationship'
                                      },
                                      {
                                        relation: 'address',
                                        scope: {
                                          include: [
                                            {
                                              relation: 'state',
                                              scope: {
                                                include: [
                                                  {
                                                    relation: 'country'
                                                  }
                                                ]
                                              }
                                            }
                                          ]
                                        }
                                      }
                                      // {
                                      //   relation : 'account',
                                      //   scope : {
                                      //     include : [
                                      //       {
                                      //         relation : 'guardianRelationship'
                                      //       }
                                      //     ]
                                      //   }
                                      // },
                                    ]
                                  }
                                }
                              ]
                            }
                          }
                        ]
                      }
                    }
                  ],
                  where: {
                    and: [{transactionTypeId: {inq: [1, 2]}}, {serviceProviderAccountId: null},{isNomineeDocumentGenerated : false}]
                  }
                }
              }
            ]
          },
          options
        )
        .then((transactionFeedLog: Array<TransactionFeedLog>): any => {
          if (!transactionFeedLog || !transactionFeedLog.length) {
            LoggingUtils.debug('No orders found for accounts! ', methodName);
            // add logs
            return reject({success: false});
          }

          LoggingUtils.debug('Fetched records order item ', methodName);
          let promises: any = [];
          transactionFeedLog.forEach(tflData => {
            if (tflData.orderItems) {
              tflData.orderItems.forEach(oiData => {
                if (oiData.order.account && oiData.instrument) {
                  promises.push(this.generateNomineeDocument(oiData, options));
                }
              });
            }
          });

          return Promise.allSettled(promises);
          //    resolve({})
        })
        .then(data => {
          // fsExtra.emptyDirSync(path.resolve(__dirname, `../../.tmp/`));
          return resolve(data);
        })
        .catch(err => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  generateNomineeDocument(orderItem: OrderItem, options?: Options) {
    const methodName = 'generateZipForDocuments';
    let rtaId = orderItem.rtaId;
    let account = orderItem.order.accountId;
    let accounts: Account[], zip: any;
    const accountWisetiffFiles: any = [];
    let zipPath = '';
    let fileName = '';
    let filepaths: any = [];
    LoggingUtils.debug('data of orderItem',JSON.stringify({
      orderItem : orderItem.id,
      account : account
    }))
    let accountZipFolderName: any, accountWiseZipFolder: any, zipContainerFileName: any, doc_filename: string,zipContainerFileNameZip: any,nomineeDocument: NomineeDocument;
    return new Promise((resolve, reject) => {
      this.accountRepository
        .find(
          {
            where: {
              id: {
                inq: [account]
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
                      inq: [account]
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
          LoggingUtils.debug('account aof details',accountInstances)
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
          LoggingUtils.debug('data of generatedAPPFiles line 525',JSON.stringify({
            orderItem : orderItem.id,
            uniqueId : orderItem.uniqueId,
            generatedAPPFiles : JSON.stringify(generatedAPPFiles),
            account : account
          }))
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
          LoggingUtils.debug('data of files line 542',JSON.stringify({
            orderItem : orderItem.id,
            uniqueId : orderItem.uniqueId,
            filess : JSON.stringify(files),
            account : account
          }))
          return Promise.resolve(files);
        })
        //---- processing processing files
        .then(allAccountsDocumentsTobeUploaded => {
          LoggingUtils.debug('data of allAccountsDocumentsTobeUploaded line 552',JSON.stringify({
            orderItem : orderItem.id,
            uniqueId : orderItem.uniqueId,
            filess : JSON.stringify(allAccountsDocumentsTobeUploaded),
            account : account
          }))
          LoggingUtils.debug('9 downloading files to server ', methodName);
          return Bluebird.map(allAccountsDocumentsTobeUploaded, (documentsTobeUploaded: any) => {
            return Bluebird.map(documentsTobeUploaded, (document: any) => {
              let downloadPath = path.resolve(__dirname, '../../.tmp/', document.name + new Date().getTime());
              return ContainerUtils.downloadFileToServer(this.fileStorageService, document.containerName, document.name, downloadPath);
            });
          });
        })
        //--- downloading file to service .tmp
        .then(async accountWiseDownloadedFiles => {
          LoggingUtils.debug('data of accountWiseDownloadedFiles line 568',JSON.stringify({
            orderItem : orderItem.id,
            uniqueId : orderItem.uniqueId,
            filess : JSON.stringify(accountWiseDownloadedFiles),
            account : account
          }))
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
              let pdfImage = await new PDFImage(downloadedFiles[0], {
                combinedImage: true,
                adjoinImage: true,
                convertExtension: 'tiff',
                graphicsMagick: true,
                convertOptions: {
                  '-quality': '100',
                  '-units': 'PixelsPerInch',
                  '-density': '144',
                  '-compress': 'LZW'
                }
              });

              filepaths.push(downloadedFiles[0]);
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
          LoggingUtils.debug('data of accountWiseTiffFilesArr line 611',JSON.stringify({
            orderItem : orderItem.id,
            uniqueId : orderItem.uniqueId,
            filess : JSON.stringify(accountWiseTiffFilesArr),
            account : account
          }))
          LoggingUtils.debug('14 mapping tiff files with acc ', methodName);
          _.each(accountWiseTiffFilesArr, (tiffFilesArr, index) => {
            accountWisetiffFiles.push(tiffFilesArr);
          });
          LoggingUtils.debug('15 resolving  accountwiseTiffArr', methodName);
          LoggingUtils.debug('data of accountWisetiffFiles line 622',JSON.stringify({
            orderItem : orderItem.id,
            uniqueId : orderItem.uniqueId,
            filess : JSON.stringify(accountWisetiffFiles),
            account : account
          }))
          return Promise.resolve(accountWiseTiffFilesArr);
        })
        // ----  mapping tiff with account and pushing to global.
        // fatch batch and sequence for karvay and annexure
        .then(async () => {
          LoggingUtils.debug('17 calculating batch and sequence ', methodName);
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
              pancardHolders.push(accountDetails.primaryHolder);
            }
            if (accountDetails.secondaryHolder && accountDetails.secondaryHolder.investorDetails.panCardNumber) {
              pancardHolders.push(accountDetails.secondaryHolder);
            }
            if (accountDetails.tertiaryHolder && accountDetails.tertiaryHolder.investorDetails.panCardNumber) {
              pancardHolders.push(accountDetails.tertiaryHolder);
            }
            let accIndex = -1;
            for (const accountHolder of pancardHolders) {
              accIndex = accIndex + 1;
              // _.each(pancardHolders, async (accountHolder, accIndex) => {
              const panCardNumber = accountHolder.investorDetails.panCardNumber;
              let startDate = moment().startOf('day')
              let endDate = moment().endOf('day')
              let data: any = await this.nomineeDocumentRepository.count(
                {
                  and: [
                    {
                      generatedDate: {
                        gte: startDate
                      }
                    },
                    {
                      generatedDate: {
                        lte: endDate
                      }
                    }
                  ]
                },
                options
              ).catch((err) => {
                reject(err)
              });
              const count = String(data.count+1).padStart(4,'0')
              nomineeDocument = await this.nomineeDocumentRepository.create(
                {
                  isActive : false,
                  accountId: orderItem.order.accountId,
                  rtaId: orderItem.rtaId,
                  generatedDate: new Date(),
                  serviceProviderId: orderItem.instrument.serviceProviderId,
                  remarks : `${orderItem.uniqueId}`
                },
                options
              );
              if (rtaId === AppConstant.RTA_KARVY) {
                accountWiseZipFolder = zip;
                zipContainerFileNameZip = `${orderItem.instrument.serviceProvider.primaryAMCCode!}TRXN${count}`; // `AMCcodeTRXNNNN`; //`{}
                zipContainerFileName = zipContainerFileNameZip + String(new Date().getTime())
                zipPath = await path.resolve(__dirname, '../../.tmp/', zipContainerFileName);
                doc_filename = `${orderItem.instrument.serviceProvider.primaryAMCCode!}~0005~${orderItem.uniqueId!}.tif`
              } else if (rtaId === AppConstant.RTA_CAMS) {
                let headers = this.headers_dbf();

                const record = this.createEmptyRecord();
                accountZipFolderName = `NOM_${moment().format('DDMMYYYY')}_${panCardNumber}`;
                accountWiseZipFolder = zip.folder(accountZipFolderName);
                let documentName = `NOM_${moment().format('DDMMYYYY')}_${panCardNumber}.dbf`;
                //zipContainerFileName = `Text_${AppConstant.ARN_RIA}${moment().format('DDMMYYYY')}`;
                zipContainerFileNameZip = `${orderItem.instrument.serviceProvider.primaryAMCCode}TRXN${count}`;
                zipContainerFileName = zipContainerFileNameZip  + String(new Date().getTime());
                const inputFilePath = path.resolve(__dirname, `../../.tmp/${String(new Date().getTime())}${documentName}`);
                LoggingUtils.debug('step 1 - doc_name before DBF',JSON.stringify({
                  orderItem : orderItem.id!,
                  transactionNumber : orderItem.uniqueId!,
                  serviceProvider : orderItem.instrument.serviceProvider.primaryAMCCode!,
                  inputFilePath :inputFilePath,
                  doc_filename : doc_filename,
                  zipContainerFileNameZip : zipContainerFileNameZip
                }))
                doc_filename = `FN$${orderItem.instrument.serviceProvider.primaryAMCCode!}$${AppConstant.ARN_USER_CODE}$${orderItem.uniqueId!}.tif`
                record.AMC_CODE = orderItem.instrument.serviceProvider.primaryAMCCode;
                record.USER_CODE = AppConstant.ARN_USER_CODE;
                record.USR_TRXNN = Number(orderItem.uniqueId!);
                record.PAN = panCardNumber;
                record.FH_NAME = orderItem.order.account.primaryHolder.name;
                record.DOC_FILEN = doc_filename.split(".")[0];
                record.DOC_ID = '';
                record.DOC_TYPE = 'NOM';
                // var buff = dbf.structure([requiredFileds]);
                await fs.promises.unlink(inputFilePath).catch(
                  err => {
                    LoggingUtils.error(err,'generateNomineeDocuments')
                  }
                );
                var buff_dbffile = await DBFFile.create(inputFilePath, headers);
                LoggingUtils.debug('step 2 - doc_name after DBF',JSON.stringify({
                  orderItem : orderItem.id!,
                  transactionNumber : orderItem.uniqueId!,
                  serviceProvider : orderItem.instrument.serviceProvider.primaryAMCCode!,
                  inputFilePath :inputFilePath,
                  doc_filename : doc_filename,
                  zipContainerFileNameZip : zipContainerFileNameZip
                }))
                await buff_dbffile.appendRecords([record]);
                const options = {
                  flags: 'wx',
                  encoding: 'utf8',
                  fd: null,
                  mode: 0o666,
                  autoClose: true
                };
                zipPath = path.resolve(__dirname, '../../.tmp/', zipContainerFileName);
                let filesData = await fs.readFileSync(inputFilePath);
                await zip.file(documentName, filesData);
                filepaths.push(inputFilePath);
              }
              LoggingUtils.debug('20 reading tiff files ', methodName);
              const tiffFiles = accountWisetiffFiles[index];
              // fileName =
              //   rtaId === 1
              //     ? `${orderItem.instrument.serviceProvider.primaryAMCCode!}~0005~${orderItem.uniqueId!}.tif`
              //     : rtaId === 2
              //     ? `FN$${orderItem.instrument.serviceProvider.primaryAMCCode!}$${AppConstant.ARN_USER_CODE}$${orderItem.uniqueId!}.tif`
              //     : '';
              fileName = doc_filename ? doc_filename : '';

              let filesData = await fs.readFileSync(tiffFiles);
              await accountWiseZipFolder.file(fileName, filesData);
              LoggingUtils.debug('step 3 - doc_name after Tiff',JSON.stringify({
                orderItem : orderItem.id!,
                transactionNumber : orderItem.uniqueId!,
                serviceProvider : orderItem.instrument.serviceProvider.primaryAMCCode!,
                doc_filename : doc_filename,
                zipContainerFileNameZip : zipContainerFileNameZip
              }))
              filepaths.push(tiffFiles);
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
              const inputFilePath = path.resolve(__dirname, `../../.tmp/${containerFileName}`);
              LoggingUtils.debug('22 uploading to container ', methodName);
              const zipUploaded: any = await ContainerUtils.uploadFileFromServer(
                this.fileStorageService,
                FileStorageContainerConfig.getGcpContainerName('nomineedoc'),
                containerFileName,
                inputFilePath
              );
              filepaths.push(inputFilePath);
              await this.fileStorageService.getFile(
                FileStorageContainerConfig.getGcpContainerName('nomineedoc'),
                containerFileName,
                async (err, reply) => {
                  if (err) {
                    return err;
                  }
                  LoggingUtils.debug('Logging User Management AppFile', reply);
                  let fileObj = {
                    containerName: FileStorageContainerConfig.getGcpContainerName('nomineedoc'),
                    path: reply.name,
                    originalFileName: zipContainerFileNameZip+'.zip',
                    name: reply.name,
                    size: reply.size,
                    extension: 'zip',
                    mimeType: 'application/zip',
                    checksum: zipUploaded.checksum
                  };
                  const zipFile = await this.userManagementAppFileRepository.create(fileObj, options);
                  LoggingUtils.debug('24 app file entry done ', methodName);
                  await this.nomineeDocumentRepository.updateById(
                    nomineeDocument.id,
                    {
                      isActive : true,
                      status: Option.GLOBALOPTIONS.NOMINEEDOCUMENTSTATUS.pending.value,
                      aofFileName: fileName,
                      appFileId: zipFile.id,
                    },
                    options
                  );

                  await this.orderItemRepository.updateById(
                    orderItem.id,
                    {
                      isNomineeDocumentGenerated : true
                    },
                    options
                  )

                  LoggingUtils.debug('zip written.');
                  LoggingUtils.debug('23 unkink tmp files ', methodName);
                  for (let item of filepaths) {
                    await fs.promises.unlink(item).catch(
                      err => {
                        LoggingUtils.error(err,'generateNomineeDocuments')
                      }
                    );
                  }
                  // fsExtra.emptyDirSync(path.resolve(__dirname, `../../.tmp/`));
                  return resolve({success: true});
                }
              );
            });
        })
        .catch((error: Error) => {
          LoggingUtils.error(error, methodName);
          reject(error);
        });
    });
  }
  private headers_dbf(): any {
    let headers = [
      {name: 'AMC_CODE', type: 'C', size: 3},
      {name: 'USER_CODE', type: 'C', size: 10},
      {name: 'USR_TRXNN', type: 'N', size: 15},
      {name: 'PAN', type: 'C', size: 40},
      {name: 'FH_NAME', type: 'C', size: 70},
      {name: 'DOC_FILEN', type: 'C', size: 40},
      {name: 'DOC_ID', type: 'C', size: 150},
      {name: 'DOC_TYPE', type: 'C', size: 3}
    ];
    return headers;
  }

  private createEmptyRecord(): any {
    const record = {
      AMC_CODE: null,
      USER_CODE: null,
      USR_TRXNN: null,
      PAN: null,
      FH_NAME: 0,
      DOC_FILEN: null,
      DOC_ID: null,
      DOC_TYPE: null
    };
    return record;
  }
}
