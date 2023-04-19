import {injectable, inject, BindingScope} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {
  UserManagementAppFile,
  UserManagementAppFileRelations,
  UserManagementAppFileRepository,
  RestError,
  FileStorageContainerConfig,
  AccountRepository,
  Account,
  Option,
  IStorageService,
  DocumentUpload,
  DocumentUploadRepository,
  Mandate,
  MandateRepository,
  BankAccountRepository,
  InvestorDetailsRepository,
  LoggingUtils,


  ContainerUtils,
  MimeTypesConfig
} from 'common';
import {promisify} from 'util';
import {Request, Response} from '@loopback/rest';
import AppConstant from 'common/dist/constants/app-constant';
import Bluebird from 'bluebird';
import * as path from 'path';
import * as fs from 'fs';
import {CryptoUtils} from 'common';
import JSZip from 'jszip';

type ContainerFilter = {
  containerName: string;
  originalFileName: string;
};
// All business logic goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class UserManagementAppFileFacade {
  constructor(
    @repository(UserManagementAppFileRepository) private userManagementAppFileRepository: UserManagementAppFileRepository,
    @repository(AccountRepository) private accountRepository: AccountRepository,
    @inject('services.fileStorageComponent')
    private fileStorageService: IStorageService,
    @repository(DocumentUploadRepository) private documentUploadRepository: DocumentUploadRepository,
    @repository(MandateRepository) private mandateRepository: MandateRepository,
    @repository(BankAccountRepository) private bankAccountRepository: BankAccountRepository,
    @repository(InvestorDetailsRepository) private investorDetailsRepository: InvestorDetailsRepository
  ) {}

  async create(entity: DataObject<UserManagementAppFile>, options?: Options): Promise<UserManagementAppFile> {
    return this.userManagementAppFileRepository.create(entity, options);
  }

  async createAll(entities: DataObject<UserManagementAppFile>[], options?: Options): Promise<UserManagementAppFile[]> {
    return this.userManagementAppFileRepository.createAll(entities, options);
  }

  async save(entity: UserManagementAppFile, options?: Options): Promise<UserManagementAppFile> {
    return this.userManagementAppFileRepository.save(entity, options);
  }

  async find(
    filter?: Filter<UserManagementAppFile>,
    options?: Options
  ): Promise<(UserManagementAppFile & UserManagementAppFileRelations)[]> {
    return this.userManagementAppFileRepository.find(filter, options);
  }

  async findOne(
    filter?: Filter<UserManagementAppFile>,
    options?: Options
  ): Promise<(UserManagementAppFile & UserManagementAppFileRelations) | null> {
    return this.userManagementAppFileRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<UserManagementAppFile>,
    options?: Options
  ): Promise<UserManagementAppFile & UserManagementAppFileRelations> {
    return this.userManagementAppFileRepository.findById(id,filter, options);
  }

  async update(entity: UserManagementAppFile, options?: Options): Promise<void> {
    return this.userManagementAppFileRepository.update(entity, options);
  }

  async delete(entity: UserManagementAppFile, options?: Options): Promise<void> {
    return this.userManagementAppFileRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<UserManagementAppFile>, where?: Where<UserManagementAppFile>, options?: Options): Promise<Count> {
    return this.userManagementAppFileRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<UserManagementAppFile>, options?: Options): Promise<void> {
    return this.userManagementAppFileRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<UserManagementAppFile>, options?: Options): Promise<void> {
    return this.userManagementAppFileRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<UserManagementAppFile>, options?: Options): Promise<Count> {
    return this.userManagementAppFileRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.userManagementAppFileRepository.deleteById(id, options);
  }

  async count(where?: Where<UserManagementAppFile>, options?: Options): Promise<Count> {
    return this.userManagementAppFileRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.userManagementAppFileRepository.exists(id, options);
  }

  async getContainerDetails(containerDetails: ContainerFilter): Promise<object> {
    return new Promise((resolve, reject) => {
      if (!(containerDetails && containerDetails.containerName)) {
        return reject(new RestError(400, 'Container name cannot be blank or empty!', {systemcode : 1233}));
      }
      let filter: any = {};
      if (containerDetails && containerDetails.containerName === FileStorageContainerConfig.getGcpContainerName('signatures')) {
        filter = {
          where: {
            containerName: containerDetails.containerName,
            isActive: true
          },
          include: [
            {
              relation: 'investorDetailsForSignature',
              scope: {
                include: ['appUser']
              }
            }
          ]
        };
      } else {
        return reject(new RestError(400, 'Please provide a valid container name!', {systemcode : 1233}));
      }
      this.userManagementAppFileRepository
        .find(filter)
        .then((responseData: any) => {
          return resolve(responseData);
        })
        .catch((err: Error) => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  async uploadDocument(accountId: number, docType: number, request?: Request, response?: Response): Promise<object> {
    const documentUploadType = {
      [Option.GLOBALOPTIONS.DOCUMENTUPLOADTYPE.pancards.value]: {
        containerName: 'pancards',
        columnName: 'fk_id_pan_image_file',
        dbModelName: 'panImageFileId',
        tableNames: ['investorDetails']
      },
      [Option.GLOBALOPTIONS.DOCUMENTUPLOADTYPE.kyc.value]: {
        containerName: 'kyc',
        columnName: 'fk_id_kyc_image_file',
        dbModelName: 'kycImageFileId',
        tableNames: ['investorDetails']
      },
      [Option.GLOBALOPTIONS.DOCUMENTUPLOADTYPE.signatures.value]: {
        containerName: 'signatures',
        columnName: 'fk_id_signature_image_file',
        dbModelName: 'signatureImageFileId',
        tableNames: ['investorDetails']
      },
      [Option.GLOBALOPTIONS.DOCUMENTUPLOADTYPE.relationshipdocuments.value]: {
        containerName: 'relationshipdocuments',
        columnName: 'fk_id_rel_document_file',
        dbModelName: 'relationshipDocumentImageFileId',
        tableNames: ['investorDetails']
      },
      [Option.GLOBALOPTIONS.DOCUMENTUPLOADTYPE.cheques.value]: {
        containerName: 'cheques',
        bankAccountColumnName: 'fk_id_cheque_image_file',
        dbModelName: 'chequeImageFileId',
        tableNames: ['bankAccount']
      },
      // [Option.GLOBALOPTIONS.DOCUMENTUPLOADTYPE.aadharback.value]: {
      //   containerName: 'aadharback',
      //   columnName: 'fk_id_aadhar_back_image_file',
      //   dbModelName: 'aadharBackImageFileId',
      //   tableNames: ['kycEntryLog']
      // },
      // [Option.GLOBALOPTIONS.DOCUMENTUPLOADTYPE.aadharfront.value]: {
      //   containerName: 'aadharfront',
      //   columnName: 'fk_id_aadhar_front_image_file',
      //   dbModelName: 'aadharFrontImageFileId',
      //   tableNames: ['kycEntryLog']
      // },
      [Option.GLOBALOPTIONS.DOCUMENTUPLOADTYPE.aof.value]: {
        containerName: 'aof',
        columnName: 'fk_id_file',
        dbModelName: 'userManagementAppFileId',
        tableNames: ['documentUpload']
      },
      [Option.GLOBALOPTIONS.DOCUMENTUPLOADTYPE.mandates.value]: {
        containerName: 'mandates',
        columnName: 'fk_id_file',
        dbModelName: 'userManagementAppFileId',
        tableNames: ['mandate']
      }
    };
    let file_paths : Array<string> = []
    return new Promise((resolve, reject) => {
      let accountDetails: Account | null;

      const documentType = documentUploadType[docType] || {};
      const container = FileStorageContainerConfig.getGcpContainerName(documentType.containerName);
      const tablesTobeUpdated = documentType.tableNames;
      const dbModelName = documentType.dbModelName;

      this.accountRepository
        .findOne({
          where: {
            id: accountId
          },
          include: [
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
              relation: 'bankAccounts',
              scope: {
                include: [
                  {
                    relation: 'mandates'
                  }
                ]
              }
            }
          ]
        })
        .then(result => {
          accountDetails = result;
          if (!accountDetails) {
            return Promise.reject(new RestError(404, `Account not found !`, {systemcode : 1086}));
          }
          const uploadPromise = promisify(this.fileStorageService.upload);
          // file upload.
          return uploadPromise(container, request, response, {}).then((data: any) => {
            if (!data) {
              return Promise.reject(new RestError(400, 'File not uploaded',{systemcode : 1026}));
            }
            return data;
          });
        })
        .then((data:any)=> ContainerUtils.checkMimeType(this.fileStorageService,data,MimeTypesConfig.MimeTypes.png.name))
        .then(async (filesData: any) => {
          if (!filesData?.files || Object.keys(filesData.files).length == 0) {
            return Promise.reject(new RestError(404, `No files found!`, {systemcode : 1027}));
          } else {
            const file = filesData.files.file[0];
            const downloadFile = await ContainerUtils.downloadFileToServer(
              this.fileStorageService,
              container,
              file.name,
              path.resolve(__dirname, '../../.tmp/', file.name)
            )
            file_paths.push(downloadFile)
            const content = await fs.promises.readFile(downloadFile);
            const fileChecksum = await CryptoUtils.generateFileChecksum(content);

            const isValidFileType = await ContainerUtils.validateFileType(downloadFile,MimeTypesConfig.MimeTypes.msExcel.possibleExtensions,content)

            await fs.promises.unlink(downloadFile);
            if(!isValidFileType){
              return Promise.reject(new RestError(465, "The file format is invalid. Please upload the file in correct format.", {systemcode : 1008}))
            }


            return this.userManagementAppFileRepository.create({
              containerName: container,
              path: file.name,
              originalFileName: file.originalFilename,
              name: file.name,
              size: file.size,
              extension: file.name.split('.')[file.name.split('.').length - 1],
              mimeType: file.type,
              checksum : fileChecksum
            });
          }
        })
        .then(appFile => {
          if (appFile) {
            return Bluebird.map(tablesTobeUpdated, (tableName: string) => {
              if (accountDetails && tableName === 'bankAccount') {
                const bankAccounts = accountDetails?.bankAccounts;
                let bankAccountInstance: any = bankAccounts && bankAccounts[0];
                return this.bankAccountRepository.updateById(bankAccountInstance?.id!, {chequeImageFileId: appFile.id});
              } else if (accountDetails && tableName === 'investorDetails') {
                const investorDetails = accountDetails?.primaryHolder?.investorDetails;
                return this.investorDetailsRepository.updateById(investorDetails?.id!, {
                  [dbModelName]: appFile.id
                });
              }
              //@todo will implement after dependency clearence
              // else if (tableName === 'documentUpload') {
              //   return Bluebird.map([AppConstant.RTA_KARVY, AppConstant.RTA_CAMS], (rta: any) => {
              //     return this.documentUploadRepository
              //       .findOne({
              //         where: {
              //           accountId: accountId, // map accountid
              //           rtaId: rta
              //         }
              //       })
              //       .then(documentUpload => {
              //         if (documentUpload) {
              //           documentUpload.aofFileId = appFile.id;
              //           return documentUpload.save();
              //         } else {
              //           return this.documentUploadRepository.create({
              //             accountId: accountId,
              //             rtaId: rta,
              //             documentSatus: Option.GLOBALOPTIONS.DOCUMENTSTATUS.pending.value,
              //             aofFileId: appFile.id
              //           });
              //         }
              //       });
              //   });
              // }
              else if (tableName === 'mandate') {
                return this.mandateRepository
                  .findOne({
                    where: {
                      accountId: accountId
                    }
                  })
                  .then(accountMandate => {
                    if (accountMandate) {
                      return this.mandateRepository.updateById(accountMandate?.id!, {userManagementAppFileId: appFile.id});
                    } else {
                      return Promise.reject(new RestError(404, 'Mandate not found!', {systemcode : 1366}));
                    }
                  });
              }
            });
          }
        })
        // .then(() => {
        //   return Operation.app.engines.DocumentUploadReplicator.replicateAllDocumentsForAccountAndRTA([accountId], [RTA.KARVY, RTA.CAMS]);
        // })
        .then(() => {
          resolve({success: true});
        })
        .catch(async (err: Error) => {
          LoggingUtils.error(err);

          for(let item of file_paths){

          // we are using existSync as exist is deprecated and this is the only function exist to check the Existing of the File
          let val = fs.existsSync(item)
          if(val)
          await fs.promises.unlink(item)

          }
          return reject(err);
        });
    });
  }
  async userManagementDownloadFile(containerName: string | any, fileName: string | any, request?: Request, response?: Response) {
    try {
      const gcpContainerName = FileStorageContainerConfig.getGcpContainerName(containerName)
      if (containerName && fileName) {
        const result = await ContainerUtils.loadFileAsBuffer(this.fileStorageService, gcpContainerName, fileName);
        const fetchChecksum:any = await this.userManagementAppFileRepository.findOne({
          where: {
            containerName: gcpContainerName,
            name: fileName,
            isActive:true,
          }
        })
        if (fetchChecksum && fetchChecksum.checksum){
          if(result.checksum == fetchChecksum.checksum){
            return result.file;
          } else {
            return Promise.reject(new RestError(465, 'Checksum invalid',{systemcode : 1025}));
          }
        } else {
          return Promise.reject(new RestError(465, 'Checksum not found',{systemcode : 1025}));
        }
      } else {
        return Promise.reject(new RestError(404, 'Container name or file name is missing!', {systemcode : 1233}));
      }

    } catch (err) {
      LoggingUtils.error(err)
      return Promise.reject();
    }
  }

  async downloadMultipleuserManagementDownloadFile(containerFilter: any) {
    try {

      let zip = new JSZip()
      for (const container of containerFilter){
        if (container.containerName && container.fileName) {
          const result = await ContainerUtils.loadFileAsBuffer(
            this.fileStorageService,
            container.containerName,
            container.fileName
          );
          const fetchChecksum:any = await this.userManagementAppFileRepository.findOne({
            where: {
              containerName:container.containerName,
              name: container.fileName,
              isActive:true,
            }
          })
          if(fetchChecksum.checksum == result.checksum){
            zip.file(fetchChecksum.originalFileName, result.file);
          }
        }
      }
      return  zip.generateAsync({type: 'nodebuffer'})
    } catch (err) {
      LoggingUtils.error(err);
      throw err;
    }
  }

  async userManagementAppFileMappingDetails(filter: any,filterObject: any, options: Options): Promise<any>{
    return new Promise(async (resolve, reject) => {
      let count: Count;
      let response: Object = {};


      count = await this.userManagementAppFileRepository.count(filter, options);
      return this.userManagementAppFileRepository
        .find({...filter}, options)
        .then(async (result: any[]) => {

          let searchCriteria = new Map();
          let valueToSearch: string;
          filterObject.where.find((data: Object) => {
            searchCriteria.set(Object.keys(data)[0], Object.values(data)[0]);
          });

          let updatedArray = result.filter(data => {

            if (searchCriteria.has('accountUniqueId')) {
              if (data.investorDetailsForSignature &&
                data.investorDetailsForSignature.appUser &&
                data.investorDetailsForSignature.appUser.primaryAccounts &&
                data.investorDetailsForSignature.appUser.primaryAccounts.length &&
                data.investorDetailsForSignature.appUser.primaryAccounts[0].uniqueId) {
                valueToSearch = searchCriteria.get('accountUniqueId').toLowerCase();
                if (!data.investorDetailsForSignature.appUser.primaryAccounts[0].uniqueId.toLowerCase().includes(valueToSearch)) {
                  return false;
                }
              }else{
                return false;
              }
            }
            if (searchCriteria.has('accountName')) {
              if (data.investorDetailsForSignature &&
                data.investorDetailsForSignature.appUser &&
                data.investorDetailsForSignature.appUser.primaryAccounts &&
                data.investorDetailsForSignature.appUser.primaryAccounts.length &&
                data.investorDetailsForSignature.appUser.primaryAccounts[0].name) {
                valueToSearch = searchCriteria.get('accountName').toLowerCase();
                if (!data.investorDetailsForSignature.appUser.primaryAccounts[0].name.toLowerCase().includes(valueToSearch)) {
                  return false;
                }
              }else{
                return false;
              }
            }
            if (searchCriteria.has('email')) {
              if (data.investorDetailsForSignature &&
                data.investorDetailsForSignature.appUser &&
                data.investorDetailsForSignature.appUser.email) {
                valueToSearch = searchCriteria.get('email').toLowerCase();
                if (!data.investorDetailsForSignature.appUser.email.toLowerCase().includes(valueToSearch)) {
                  return false;
                }
              }else{
                return false;
              }
            }


              return true;

          });

          const data = updatedArray.slice(filterObject.offset, filterObject.limit + filterObject.offset);
          response = {
            data: data,
            count: updatedArray.length
          };
          return resolve(response);
        })
        .catch((error: any) => {
          LoggingUtils.error(error);
          return reject(error);
        });
    });
  }
}
