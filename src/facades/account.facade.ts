import {injectable, /* inject, */ BindingScope, inject, service} from '@loopback/core';
import {Response} from '@loopback/rest';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {
  Account,
  AccountRelations,
  AccountRepository,
  InvestorNominee,
  RestError,
  RiskProfileHistory,
  RiskProfileHistoryRepository,
  RiskProfileQuestionSubmittedAnswer,
  RiskProfileQuestionSubmittedAnswerRepository,
  RiskProfileRepository,
  StateRepository,
  CountryRepository,
  InvestorDetailsRepository,
  InvestorNomineeRepository,
  AddressRepository,
  RelationshipRepository,
  AppUserRepository,
  BankAccount,
  LoggingUtils,
  ServiceProvider,
  ServiceProviderAccount,
  ServiceProviderAccountRepository,
  Option,
  TransactionRepository,
  Transaction,
  HoldingRepository,
  Holding,
  InstrumentRepository,
  Instrument,
  InvestorNomineeRelations,
  Address,
  InvestorDetails,
  AppUser,
  PDFUtils,
  ViewUtils,
  ContainerUtils,
  IStorageService,
  FileStorageComponent,
  FileStorageContainerConfig,
  UserManagementAppFileRepository,
  AccountAppFileMappingRepository,
  DocumentUploadRepository,
  TransactionalDataRefreshingQueueMessage,
  TransactionalDataRefreshingQueueMessageEventType,
  QueueProducer,
  ExcelUtils,
  CryptoUtils,
  NotificationUtils,
  NotificationTopics
} from 'common';
import {CoreBankingRepository} from '../repositories/core-banking.repository';
import {ConsolidatedDocumentGenerationEngine} from '../engines/consolidated-document-generation.engine';
import _, {map} from 'underscore';
import moment from 'moment-timezone';
import {response} from 'express';
import {promisify} from 'util';
import {RiskProfile} from 'common';
export type skippedNomineeType = {skippedNominee: boolean};
import * as path from 'path';
import * as fs from 'fs';
import {AnyMxRecord} from 'dns';
import {uniqBy} from 'lodash';
import AppConstant from 'common/dist/constants/app-constant';

// All business logic goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class AccountFacade {
  constructor(
    @repository(RiskProfileRepository)
    private riskProfileRepository: RiskProfileRepository,
    @repository(RiskProfileHistoryRepository)
    private riskProfileHistoryRepository: RiskProfileHistoryRepository,
    @repository(RiskProfileQuestionSubmittedAnswerRepository)
    private riskProfileQuestionSubmittedAnswerRepository: RiskProfileQuestionSubmittedAnswerRepository,
    @repository(AccountRepository) private accountRepository: AccountRepository,
    @repository(StateRepository) private stateRepository: StateRepository,
    @repository(CountryRepository) private countryRepository: CountryRepository,
    @repository(InvestorDetailsRepository) private investorDetailsRepository: InvestorDetailsRepository,
    @repository(InvestorNomineeRepository) private investorNomineeRepository: InvestorNomineeRepository,
    @repository(AddressRepository) private addressRepository: AddressRepository,
    @repository(RelationshipRepository) private relationshipRepository: RelationshipRepository,
    @repository(AppUserRepository) private appUserRepository: AppUserRepository,
    @repository(ServiceProviderAccountRepository) private serviceProviderAccountRepository: ServiceProviderAccountRepository,
    @repository(TransactionRepository) private transactionRepository: TransactionRepository,
    @repository(CoreBankingRepository)
    private coreBankingRepository: CoreBankingRepository,
    @repository(HoldingRepository)
    private holdingRepository: HoldingRepository,
    @repository(InstrumentRepository)
    private instrumentRepository: InstrumentRepository,
    @inject('services.fileStorageComponent')
    private fileStorageService: IStorageService,
    @repository(UserManagementAppFileRepository) private userManagementAppFileRepository: UserManagementAppFileRepository,
    @repository(AccountAppFileMappingRepository) private accountAppFileMappingRepository: AccountAppFileMappingRepository,
    @repository(DocumentUploadRepository) private documentUploadRepository: DocumentUploadRepository,
    @service(ConsolidatedDocumentGenerationEngine) private consolidatedDocumentGenerationEngine: ConsolidatedDocumentGenerationEngine
  ) {}
  getAge(dateString: string): number {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  async create(entity: DataObject<Account>, options?: Options): Promise<Account> {
    return this.accountRepository.create(entity, options);
  }

  async generateAOF(id: number | undefined, aofType: string, callback: any, options?: Options): Promise<any> {
    if (!id) {
      return Promise.reject(new RestError(400, `AccountId is required !`, {systemcode: 1082}));
    }

    if (!aofType || ['nrm', 'ria'].indexOf(aofType) === -1) {
      return Promise.reject(new RestError(400, 'Valid Type of Form Required!', {systemcode: 1084}));
    }

    let account: any, fileName: any, createdFile: any, documents: any;

    let documentsTobeUploaded: any = [];
    try {
      let accountInstance = await this.accountRepository.findById(
        id,
        {
          include: [
            {
              relation: 'bankAccounts',
              scope: {
                where: {
                  isActive: true,
                  isDefault: true
                },
                include: [
                  {
                    relation: 'bankBranch',
                    scope: {
                      include: [
                        {
                          relation: 'address'
                        },
                        {
                          relation: 'bank'
                        }
                      ]
                    }
                  },
                  {
                    relation: 'bankAccountType'
                  },
                  {
                    relation: 'mandates'
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
                      include: [
                        {
                          relation: 'permanentAddress',
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
                        },
                        {
                          relation: 'correspondenceAddress',
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
                        },
                        'occupation',
                        'wealthSource',
                        'identificationType',
                        'incomeSlab',
                        'countryOfBirth',
                        'taxResidentCountry',
                        'politicallyExposureType'
                        // 'kycImageFile',
                        // 'panImageFile'
                      ]
                    }
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
                        },
                        {
                          relation: 'correspondenceAddress',
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
                        },
                        'occupation',
                        'wealthSource',
                        'identificationType',
                        'incomeSlab',
                        'countryOfBirth',
                        'taxResidentCountry',
                        'politicallyExposureType',
                        'signatureImageFile',
                        // 'kycImageFile',
                        // 'panImageFile',
                        'investorType'
                      ]
                    }
                  }
                ]
              }
            },
            {
              relation: 'primaryNominee',
              scope: {
                include: [
                  {
                    relation: 'investorDetails',
                    scope: {
                      include: [
                        {
                          relation: 'permanentAddress',
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
                        },
                        {
                          relation: 'correspondenceAddress',
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
                        },
                        'occupation',
                        'wealthSource',
                        'identificationType',
                        'incomeSlab',
                        'countryOfBirth',
                        'taxResidentCountry',
                        'politicallyExposureType'
                        // 'kycImageFile',
                        // 'panImageFile'
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
                      include: [
                        {
                          relation: 'permanentAddress',
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
                        },
                        {
                          relation: 'correspondenceAddress',
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
                        },
                        'occupation',
                        'wealthSource',
                        'identificationType',
                        'incomeSlab',
                        'countryOfBirth',
                        'taxResidentCountry',
                        'politicallyExposureType',
                        'signatureImageFile'
                        // 'kycImageFile',
                        // 'panImageFile'
                      ]
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
                      include: [
                        {
                          relation: 'permanentAddress',
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
                        },
                        {
                          relation: 'correspondenceAddress',
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
                        },
                        'occupation',
                        'wealthSource',
                        'identificationType',
                        'incomeSlab',
                        'countryOfBirth',
                        'taxResidentCountry',
                        'politicallyExposureType',
                        'signatureImageFile'
                        // 'kycImageFile',
                        // 'panImageFile'
                      ]
                    }
                  }
                ]
              }
            },
            {
              relation: 'investorNominees',
              scope: {
                where: {
                  isActive: true,
                  isMfNominee: true
                },
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
                  //       },
                  //       {
                  //         relation : 'guardian'
                  //       }
                  //     ]
                  //   }
                  // },
                ]
              }
            },
            'primaryNomineeRelationship',
            'holdingType',
            'guardianRelationship'
          ]
        },
        options
      );
      if (!accountInstance) {
        return Promise.reject(new RestError(400, `Account not found!`, {systemcode: 1086}));
      }
      account = accountInstance.toJSON();
      // Only Onboarded user can generate AOF
      if (account.primaryHolder.appUserStatus !== Option.GLOBALOPTIONS.APPUSERSTATUS['userRegistered'].value) {
        return Promise.reject(new RestError(400, 'User Onboarding not completed', {systemcode: 1006}));
      }

      //collecting all documents which are to be uploaded
      documentsTobeUploaded.push(account.primaryHolder.investorDetails.kycImageFile);

      documentsTobeUploaded.push(account.primaryHolder.investorDetails.panImageFile);

      _.each(account.bankAccounts, bankAccount => {
        documentsTobeUploaded.push(bankAccount.chequeImageFile);
      });

      if (account.secondaryHolder) {
        documentsTobeUploaded.push(account.secondaryHolder.investorDetails.kycImageFile);
        documentsTobeUploaded.push(account.secondaryHolder.investorDetails.panImageFile);
      }

      if (account.tertiaryHolder) {
        documentsTobeUploaded.push(account.secondaryHolder.investorDetails.kycImageFile);
        documentsTobeUploaded.push(account.secondaryHolder.investorDetails.panImageFile);
      }

      // signature
      let signaturePromises = [];
      if (account.primaryHolder && account.primaryHolder.investorDetails && account.primaryHolder.investorDetails.signatureImageFile) {
        signaturePromises.push(
          ContainerUtils.downloadFileToServer(
            this.fileStorageService,
            account.primaryHolder.investorDetails.signatureImageFile.containerName,
            account.primaryHolder.investorDetails.signatureImageFile.name,
            path.resolve(__dirname, '../../.tmp/', account.primaryHolder.investorDetails.signatureImageFile.name)
          )
        );
      }

      if (
        account.secondaryHolder &&
        account.secondaryHolder.investorDetails &&
        account.secondaryHolder.investorDetails.signatureImageFile
      ) {
        signaturePromises.push(
          ContainerUtils.downloadFileToServer(
            this.fileStorageService,
            account.secondaryHolder.investorDetails.signatureImageFile.containerName,
            account.secondaryHolder.investorDetails.signatureImageFile.name,
            path.resolve(__dirname, '../../.tmp/', account.secondaryHolder.investorDetails.signatureImageFile.name)
          )
        );
      }

      if (account.tertiaryHolder && account.tertiaryHolder.investorDetails && account.tertiaryHolder.investorDetails.signatureImageFile) {
        signaturePromises.push(
          ContainerUtils.downloadFileToServer(
            this.fileStorageService,
            account.tertiaryHolder.investorDetails.signatureImageFile.containerName,
            account.tertiaryHolder.investorDetails.signatureImageFile.name,
            path.resolve(__dirname, '../../.tmp/', account.tertiaryHolder.investorDetails.signatureImageFile.name)
          )
        );
      }

      let signaturesPaths = await Promise.all(signaturePromises);
      // console.log(">>>>>>>>",signaturesPaths)

      const resolvedPath = path.resolve(`${__dirname}/../../.tmp`);
      // signaturesPaths = signaturesPaths.map(async (element) => `data:image;base64,${await ContainerUtils.convertBitmapToJpg(fs.readFileSync(element, 'base64'),resolvedPath)}`);

      for (let i = 0; i < signaturesPaths.length; i++) {
        const bufferData = await ContainerUtils.convertBitmapToJpg(fs.readFileSync(signaturesPaths[i], 'base64'), resolvedPath);
        const stringData = Buffer.from(bufferData).toString('base64');
        signaturesPaths[i] = `data:image;base64,${stringData}`;
      }
      if (account.investorNominees && account.investorNominees.length) {
        for (let i = 0; i < account.investorNominees.length; i++) {
          if (account.investorNominees[i].appUser?.investorDetails?.birthDate) {
            account.investorNominees[i].appUser.investorDetails.birthDate = moment(
              account.investorNominees[i].appUser?.investorDetails?.birthDate
            ).format('Do MMM YYYY');
          }
          // if(account.investorNominees[i].account?.guardian?.investorDetails?.birthDate){
          //   account.investorNominees[i].account.guardian.birthDate = moment(
          //     account.investorNominees[i].account?.guardian?.investorDetails?.birthDate
          //   ).format('Do MMM YYYY');
          // }
        }
      }
      documents = [];
      var data = {
        Accounts: account,
        date: {
          userDOB: moment(account.primaryHolder.investorDetails.birthDate).format('Do MMM YYYY'),
          nomineeDOB: account.primaryNominee ? moment(account.primaryNominee.investorDetails.birthDate).format('Do MMM YYYY') : '',
          secondHolderDOB: account.secondaryHolder ? moment(account.secondaryHolder.investorDetails.birthDate).format('Do MMM YYYY') : '',
          thirdHolderDOB: account.tertiaryHolder ? moment(account.tertiaryHolder.investorDetails.birthDate).format('Do MMM YYYY') : '',
          guardianDOB:
            account.guardian && account.guardian.investorDetails && account.guardian.investorDetails.birthDate
              ? moment(account.guardian.investorDetails.birthDate).format('Do MMM YYYY')
              : '',
          today: moment().tz('Asia/Kolkata').format('DD-MM-YYYY'),
          time: moment().tz('Asia/Kolkata').format('HH:mm')
        },
        // base: `${path.resolve(__dirname, '../../../')}/`,
        //currenty globle config file does not exits that its hard coded.
        config: {riaSebiNo: 'ARN-0005'},
        // config: require(`../../../server/global-config.${Account.app.NODE_ENV
        // }.json`),
        signatures: {
          userSignature: signaturesPaths[0],
          secondHolderSignature: account.secondaryHolder ? signaturesPaths[1] : '',
          thirdHolderSignature: account.tertiaryHolder ? signaturesPaths[2] : ''
        },
        documents: documents
      };
      LoggingUtils.info(`aof data,${JSON.stringify(data)}`);
      // console.log("******",data,path.resolve(__dirname, `../../../../templates/account-opening-form-ria.html`));
      /*const pdfData = await PDFUtils.toPDF(
        ViewUtils.getCompiledHtml(path.resolve(__dirname, `../../views/templates/aof/account-opening-form-${aofType}.html`), data),
        {
          // phantomPath: path.resolve(__dirname,'../../node_modules/phantomjs/bin/phantomjs'),
          format: 'A4'
          // base: `file://${path.resolve(__dirname, '../../../')}/`
        },
        path.resolve(
          __dirname,
          // '../../../../templates',
          '../../.tmp/',
          `${account.uniqueId}-${aofType}.pdf`
        )
      );*/

      const pdfData = await PDFUtils.makePDF(
        data,
        {
          format: 'A4'
        },
        path.resolve(
          __dirname,
          // '../../../../templates',
          '../../.tmp/',
          `${account.uniqueId}-${aofType}.pdf`
        )
      );
      // console.log(pdfData);
      // const pdfData = {filename: ''};

      fileName = `${account.uniqueId}-${aofType}-${Date.now()}.pdf`;
      const aofUploadRes: any = await ContainerUtils.uploadFileFromServer(
        this.fileStorageService,
        FileStorageContainerConfig.getGcpContainerName('aof'),
        fileName,
        pdfData
      );
      let fileData: any = await new Promise((resolve, reject) => {
        this.fileStorageService.getFile(FileStorageContainerConfig.getGcpContainerName('aof'), fileName, function (err: any, data: any) {
          if (err) {
            return reject(err);
          }
          return resolve(data);
        });
      });

      //create an entry
      const userManagementAppFileData = await this.userManagementAppFileRepository.create(
        {
          containerName: FileStorageContainerConfig.getGcpContainerName('aof'),
          // checksum: app.models.AppFile.getFileChecksum(file.name),
          path: fileData._metadata.name,
          originalFileName: fileData._metadata.name,
          name: fileData._metadata.name,
          size: fileData._metadata.size,
          extension: 'pdf',
          mimeType: 'application/pdf',
          checksum: aofUploadRes.checksum
        },
        options
      );

      //update mapping
      const accountFileMapping = await this.accountAppFileMappingRepository.find({where: {accountId: account.id}}, options);
      if (accountFileMapping.length > 0) {
        await this.accountAppFileMappingRepository.updateAll(
          {
            userManagementAppFileId: userManagementAppFileData.id
          },
          {
            accountId: account.id
          },
          options
        );
      } else {
        await this.accountAppFileMappingRepository.create(
          {
            accountId: account.id,
            userManagementAppFileId: userManagementAppFileData.id
          },
          options
        );
      }

      //update entry in document upload
      const documentUpload = await this.documentUploadRepository.find({where: {fk_id_account: account.id}});
      if (documentUpload.length > 0) {
        await this.documentUploadRepository.updateAll(
          {
            fk_id_file: userManagementAppFileData.id
          },
          {
            fk_id_account: account?.id
          },
          options
        );
      } else {
        await this.documentUploadRepository.create(
          {
            fk_id_account: account.id,
            documentType: Option.GLOBALOPTIONS.CUSTOMERDOCUMENTTYPE['aof'].value,
            fk_id_user: account.primaryHolderId,
            fk_id_bank_account: account?.bankAccounts[0]?.id,
            fk_id_file: userManagementAppFileData.id
          },
          options
        );
      }
      // console.log("********",fileData,userManagementAppFileData,accountFileMapping);
      //remove the temp files of signature image  and temp pdf
      signaturesPaths.push(path.resolve(__dirname, `../../.tmp/${account.uniqueId}-${aofType}.pdf`));
      await Promise.all(
        signaturesPaths.map(
          file =>
            new Promise((res, rej) => {
              fs.unlink(file, err => {
                if (err) res(0);
                res(1);
              });
            })
        )
      );
      return userManagementAppFileData;
    } catch (error) {
      LoggingUtils.error(error);
      throw error;
    }
  }
  async createAll(entities: DataObject<Account>[], options?: Options): Promise<Account[]> {
    return this.accountRepository.createAll(entities, options);
  }

  async save(entity: Account, options?: Options): Promise<Account> {
    return this.accountRepository.save(entity, options);
  }

  async find(filter?: Filter<Account>, options?: Options): Promise<(Account & AccountRelations)[]> {
    return this.accountRepository.find(filter, options);
  }

  async findOne(filter?: Filter<Account>, options?: Options): Promise<(Account & AccountRelations) | null> {
    return this.accountRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<Account>, options?: Options): Promise<Account & AccountRelations> {
    return this.accountRepository.findById(id, filter, options);
  }

  async update(entity: Account, options?: Options): Promise<void> {
    return this.accountRepository.update(entity, options);
  }

  async delete(entity: Account, options?: Options): Promise<void> {
    return this.accountRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<Account>, where?: Where<Account>, options?: Options): Promise<Count> {
    return this.accountRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<Account>, options?: Options): Promise<void> {
    return this.accountRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<Account>, options?: Options): Promise<void> {
    return this.accountRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<Account>, options?: Options): Promise<Count> {
    return this.accountRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.accountRepository.deleteById(id, options);
  }

  async count(where?: Where<Account>, options?: Options): Promise<Count> {
    return this.accountRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.accountRepository.exists(id, options);
  }

  async calculateRiskProfile(accountId: number, options?: Options): Promise<Account> {
    return new Promise((resolve, reject) => {
      let accountData: Account;
      let riskProfiles: Array<any> = [];
      let riskProfileData: RiskProfile;
      // Flag to identify wether to send set risk profile  or modify risk profile
      let sendUpdateNotification: boolean = false;
      this.accountRepository
        .findById(
          accountId,
          {
            include: [
              {
                relation: 'riskProfileQuestionSubmittedAnswers',
                scope: {
                  where: {
                    isActive: true
                  },
                  include: [
                    {
                      relation: 'riskProfileQuestion',
                      scope: {
                        where: {isActive: true},
                        include: [
                          {
                            relation: 'possibleAnswers',
                            scope: {
                              where: {isActive: true}
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              },
              {relation: 'riskProfile'},
              {relation: 'primaryHolder'}
            ]
          },
          options
        )
        .then(data => {
          if (!data) {
            return Promise.reject(new RestError(404, 'Account not found', {systemcode: 1086}));
          }
          accountData = data;
          // fetching new riskProfile ID.
          sendUpdateNotification = accountData.riskProfileId === null || accountData.riskProfileId === 0 ? false : true;
          return this.riskProfileRepository.find(
            {
              where: {
                isActive: true
              }
            },
            options
          );
        })
        .then(data => {
          riskProfiles = data;
          let foundRiskProfile: any;
          let totalScore = 0;
          if (
            accountData &&
            accountData.riskProfileQuestionSubmittedAnswers &&
            accountData.riskProfileQuestionSubmittedAnswers &&
            accountData.riskProfileQuestionSubmittedAnswers.length > 0
          ) {
            accountData.riskProfileQuestionSubmittedAnswers.forEach((submittedAnswer: any) => {
              if (
                submittedAnswer &&
                submittedAnswer.riskProfileQuestion &&
                submittedAnswer.riskProfileQuestion &&
                submittedAnswer.riskProfileQuestion.possibleAnswers &&
                submittedAnswer.riskProfileQuestion.possibleAnswers &&
                submittedAnswer.riskProfileQuestion.possibleAnswers.length > 0
              ) {
                let foundAnswer = submittedAnswer.riskProfileQuestion.possibleAnswers.filter((possibleAnswer: any) => {
                  return possibleAnswer.id === submittedAnswer.riskProfileQuestionPossibleAnswerId;
                });
                if (foundAnswer.length) {
                  totalScore += parseInt(foundAnswer[0].score);
                }
                totalScore = Number(totalScore.toFixed(2));
              }
            });
          }
          riskProfiles.forEach((riskProfile: any) => {
            if (!foundRiskProfile && riskProfile.minScore <= totalScore && riskProfile.maxScore >= totalScore) {
              foundRiskProfile = riskProfile;
            }
          });
          if (foundRiskProfile) {
            riskProfileData = foundRiskProfile;
            accountData.riskProfileId = foundRiskProfile.id;
            accountData.lastModifiedDate = new Date();
            accountData.riskProfileUpdatedDate = new Date();
            return this.accountRepository.save(accountData);
          } else {
            return Promise.reject(new RestError(400, 'Risk profile could not be updated!', {systemcide: 1007}));
          }
        })
        .then(async data => {
          if (sendUpdateNotification) {
            //Modify riskProfile
            await NotificationUtils.sendNotificationEvent({
              accountId: accountId,
              topicId: NotificationTopics.TOPICS.riskProfile.modify.value,
              notificationType: NotificationTopics.TOPICS.riskProfile.modify.topic,
              templateKeys: {
                customerName: accountData.name,
                date: moment().format('DD/MM/YY'),
                emailId: 'mailto:smartwealth@hdfcbank.com',
                fromRiskProfileName: accountData.riskProfile.name,
                toRiskProfileName: riskProfileData.name
              }
            });
          } else {
            //Set riskProfile
            await NotificationUtils.sendNotificationEvent({
              accountId: accountId,
              topicId: NotificationTopics.TOPICS.riskProfile.set.value,
              notificationType: NotificationTopics.TOPICS.riskProfile.set.topic,
              templateKeys: {
                riskProfileName: riskProfileData.name,
                link: '',
                customerName: accountData.name,
                date: moment().format('DD/MM/YY'),
                emailId: 'mailto:smartwealth@hdfcbank.com'
              }
            });
          }
          return resolve(data);
        })
        .catch(function (error) {
          LoggingUtils.error(error);
          return reject(error);
        });
    });
  }

  async submitRiskProfileAnswers(
    accountId: number,
    riskProfileAnswers: Array<RiskProfileQuestionSubmittedAnswer>,
    options?: Options
  ): Promise<Account> {
    return new Promise((resolve, reject) => {
      // need to find the account
      let account: Account;
      this.accountRepository
        .findOne({
          where: {
            id: accountId,
            isActive: true
          }
        })
        .then((accountDetails: Account | null): Promise<any> => {
          // need to find is entry of risk-profile data related to account already exist
          if (!accountDetails) {
            return Promise.reject(new RestError(400, 'Account not found', {systemcode: 1086}));
          }
          account = accountDetails;
          return this.riskProfileQuestionSubmittedAnswerRepository.find({
            where: {
              accountId: account.id,
              isActive: true
            }
          });
        })
        .then(riskProfileSubmittedAnswerDetails => {
          let promises: Array<Promise<any>> = [];
          if (riskProfileSubmittedAnswerDetails.length > 0) {
            // delete and move to history table
            let jsonData = riskProfileSubmittedAnswerDetails.map((element: any) => {
              return {
                riskProfileQuestionId: element.riskProfileQuestionId,
                riskProfilePossibleAnswerId: element.riskProfileQuestionPossibleAnswer
              };
            });
            jsonData = JSON.stringify(jsonData);
            promises = [
              this.riskProfileQuestionSubmittedAnswerRepository.deleteAll({
                where: {
                  accountId: account.id,
                  isActive: true
                }
              }),
              this.riskProfileHistoryRepository.create({
                isSubmitted: true,
                effectiveDate: new Date(),
                riskProfileData: jsonData,
                accountId: account.id,
                riskProfileId: account.riskProfileId
              })
            ];
          } else if (account.riskProfileId) {
            // for users who have already selected the risk profile without evaluating and came back to evaluate again
            promises = [
              this.riskProfileHistoryRepository.create({
                isSubmitted: true,
                effectiveDate: new Date(),
                riskProfileData: '{}',
                accountId: account.id,
                riskProfileId: account.riskProfileId
              })
            ];
          } else {
            return Promise.resolve({});
          }
          return Promise.all(promises);
        })
        .then(() => {
          // creating new values in risk-profile table
          let createData: Array<Partial<RiskProfileQuestionSubmittedAnswer>> = [];
          riskProfileAnswers.forEach(element => {
            let object: Partial<RiskProfileQuestionSubmittedAnswer> = {
              submitted: true,
              riskProfileQuestionId: element.riskProfileQuestionId,
              riskProfileQuestionPossibleAnswerId: element.riskProfileQuestionPossibleAnswerId,
              accountId: accountId
            };
            createData.push(object);
          });
          return this.riskProfileQuestionSubmittedAnswerRepository.createAll(createData);
        })
        .then(() => {
          // calculate all the answers
          return this.calculateRiskProfile(accountId, options);
        })
        .then(async account => {
          await this.dataRefreshByAccountId(account.id!);
          return resolve(account);
        })
        .catch((err: any) => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  async fetchNomineeDetailsById(id: number, isOnboardedNominee: boolean, options?: Options): Promise<object> {
    let metaData: any = {accountOpening: [], mfRTA: []};
    let nomineeData: any = [];
    return new Promise((resolve, reject) => {
      this.accountRepository
        .findOne(
          {
            where: {
              id: id,
              isActive: true
            },
            include: [
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
                  ]
                }
              }
            ]
          },
          options
        )
        .then(account => {
          if (!account) {
            return Promise.reject(new RestError(404, 'Account not found', {systemcode: 1086}));
          }
          if (account.investorNominees && account.investorNominees.length > 0) {
            account.investorNominees.forEach((element: InvestorNominee) => {
              let nomineeObject: any = {address: {}};
              let accountOpeningObj: any = {address: {}};
              let mfRTAObj: any = {};
              if (element) {
                nomineeObject.nomineeId = element.id ? element.id : null;
                nomineeObject.name = element.appUser && element.appUser?.name ? element.appUser?.name : '';
                nomineeObject.nomineeAppUserId = element.appUser && element.appUser?.id ? element.appUser?.id : null;
                nomineeObject.relationshipName = element.relationship && element.relationship?.name ? element.relationship?.name : '';
                nomineeObject.relationshipId = element.relationship && element.relationship?.id ? element.relationship?.id : null;
                nomineeObject.percentage = element?.nomineePercentage ? element?.nomineePercentage : null;
                nomineeObject.dateOfBirth =
                  element?.appUser && element?.appUser.investorDetails && element?.appUser.investorDetails?.birthDate
                    ? element?.appUser.investorDetails?.birthDate
                    : null;
                nomineeObject.address.addressId = element?.address && element?.address?.id ? element?.address?.id : null;
                nomineeObject.address.addressLine1 =
                  element?.address && element?.address?.addressLine1! ? element?.address?.addressLine1! : '';
                nomineeObject.address.addressLine2 =
                  element?.address && element?.address?.addressLine2 ? element?.address?.addressLine2 : '';
                nomineeObject.address.landmark = element?.address && element?.address?.landmark ? element?.address?.landmark : '';
                nomineeObject.address.pincode = element?.address && element?.address?.pincode ? element?.address?.pincode : '';
                nomineeObject.address.city = element?.address && element?.address?.city ? element?.address?.city : '';
                nomineeObject.address.state =
                  element?.address && element?.address?.state && element?.address?.state?.name ? element?.address?.state?.name : '';
                nomineeObject.address.stateId =
                  element?.address && element?.address?.state && element?.address?.state?.id ? element?.address?.state?.id : null;
                nomineeObject.address.country =
                  element?.address && element?.address?.country && element?.address?.country?.name ? element?.address?.country?.name : '';
                nomineeObject.address.countryId =
                  element?.address && element?.address?.country && element?.address?.country?.id ? element?.address?.country?.id : null;

                nomineeObject.guardianRelationship = element.guardianRelationship;
                nomineeObject.guardianName = element.guardianName;

                accountOpeningObj.address.addressLine1 =
                  element.address && element.address?.addressLine1 ? element?.address?.addressLine1! : '';
                accountOpeningObj.address.pincode = element.address && element.address?.pincode ? element.address?.pincode : '';
                accountOpeningObj.address.city = element.address && element.address?.city ? element?.address?.city : '';
                accountOpeningObj.address.state =
                  element.address && element.address.state && element.address.state?.name ? element?.address?.state?.name : '';
                accountOpeningObj.name = element.appUser && element.appUser?.name ? element.appUser?.name : '';
                accountOpeningObj.nomineeAppUserId = element.appUser && element.appUser?.id ? element.appUser?.id : null;
                accountOpeningObj.relationshipName = element.relationship && element.relationship?.name ? element.relationship?.name : '';
                accountOpeningObj.relationshipId = element.relationship && element.relationship?.id ? element.relationship?.id : null;
                accountOpeningObj.dateOfBirth =
                  element?.appUser && element?.appUser.investorDetails && element?.appUser.investorDetails?.birthDate
                    ? element?.appUser.investorDetails?.birthDate
                    : null;
                accountOpeningObj.nomineeId = element.id ? element.id : null;
                accountOpeningObj.address.addressId = element?.address && element?.address?.id ? element?.address?.id : null;

                mfRTAObj.nomineeId = element.id ? element.id : null;
                mfRTAObj.name = element.appUser && element.appUser?.name ? element.appUser?.name : '';
                mfRTAObj.nomineeAppUserId = element.appUser && element.appUser?.id ? element.appUser?.id : null;
                mfRTAObj.relationshipName = element.relationship && element.relationship?.name ? element.relationship?.name : '';
                mfRTAObj.relationshipId = element.relationship && element.relationship?.id ? element.relationship?.id : null;
                mfRTAObj.percentage = element?.nomineePercentage ? element?.nomineePercentage : null;
                mfRTAObj.dateOfBirth =
                  element?.appUser && element?.appUser.investorDetails && element?.appUser.investorDetails?.birthDate
                    ? element?.appUser.investorDetails?.birthDate
                    : null;

                if (isOnboardedNominee) {
                  nomineeData.push(nomineeObject);
                  metaData.accountOpening.push(accountOpeningObj);
                  metaData.mfRTA.push(mfRTAObj);
                } else {
                  if (
                    !(
                      nomineeObject.name == '' ||
                      nomineeObject.relationshipName == '' ||
                      nomineeObject.dateOfBirth == null ||
                      nomineeObject.relationshipId == null
                    )
                  ) {
                    nomineeData.push(nomineeObject);
                  }
                  if (
                    !(
                      accountOpeningObj.name == '' ||
                      accountOpeningObj.relationshipName == '' ||
                      accountOpeningObj.dateOfBirth == null ||
                      accountOpeningObj.relationshipId == null
                    )
                  ) {
                    metaData.accountOpening.push(accountOpeningObj);
                  }
                  if (
                    !(
                      mfRTAObj.name == '' ||
                      mfRTAObj.relationshipName == '' ||
                      mfRTAObj.dateOfBirth == null ||
                      mfRTAObj.relationshipId == null
                    )
                  ) {
                    metaData.mfRTA.push(mfRTAObj);
                  }
                }
              }
            });
          }
          return resolve({data: nomineeData, metaData: metaData});
        })
        .catch(reject);
    });
  }

  async fetchNomineeByAccountIdNew(accountId: number, isOnboardedNominee: boolean, options?: Options): Promise<object> {
    try {
      let nomineeData: any = [];
      let account: any;
      if (isOnboardedNominee) {
        account = await this.accountRepository.findOne(
          {
            where: {
              id: accountId,
              isActive: true
            },
            include: [
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
                    },
                    {
                      relation: 'guardianAddress',
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
                  ],
                  where: {
                    isActive: true
                  }
                }
              }
            ]
          },
          options
        );
      } else {
        account = await this.accountRepository.findOne(
          {
            where: {
              id: accountId,
              isActive: true
            },
            include: [
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
                    },
                    {
                      relation: 'guardianAddress',
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
                  ],
                  where: {
                    isActive: true,
                    isMfNominee: false
                  }
                }
              }
            ]
          },
          options
        );
      }
      if (!account) {
        return Promise.reject(new RestError(404, 'Account not found', {systemcode: 1086}));
      }

      if (account.investorNominees && account.investorNominees.length > 0) {
        for (let element of account.investorNominees) {
          let nomineeObject: any = {nomineeAddress: {}, guardianAddress: {}};
          nomineeObject.nomineeId = element.id ? element.id : null;
          nomineeObject.name = element.appUser && element.appUser?.name ? element.appUser?.name : '';
          nomineeObject.nomineeAppUserId = element.appUser && element.appUser?.id ? element.appUser?.id : null;
          nomineeObject.relationshipId = element.relationship && element.relationship?.id ? element.relationship?.id : null;
          nomineeObject.relationshipName = element.relationship && element.relationship?.name ? element.relationship?.name : '';
          nomineeObject.percentage = element?.nomineePercentage ? element?.nomineePercentage : null;
          nomineeObject.isMfNominee = element.isMfNominee;
          nomineeObject.isSyncedViaBank = element.isSyncedViaBank;
          nomineeObject.dateOfBirth =
            element?.appUser && element?.appUser.investorDetails && element?.appUser.investorDetails?.birthDate
              ? element?.appUser.investorDetails?.birthDate
              : null;
          nomineeObject.investorTypeId =
            element?.appUser && element?.appUser.investorDetails && element?.appUser.investorDetails?.investorTypeId
              ? element?.appUser.investorDetails?.investorTypeId
              : null;
          nomineeObject.nomineeAddress.addressId = element.address && element.address.id ? element.address.id : null;
          nomineeObject.nomineeAddress.addressLine1 =
            element?.address && element?.address?.addressLine1! ? element?.address?.addressLine1! : '';
          nomineeObject.nomineeAddress.addressLine2 =
            element?.address && element?.address?.addressLine2 ? element?.address?.addressLine2 : '';
          nomineeObject.nomineeAddress.addressLine3 =
            element?.address && element?.address?.addressLine3 ? element?.address?.addressLine3 : '';
          nomineeObject.nomineeAddress.landmark = element?.address && element?.address?.landmark ? element?.address?.landmark : '';
          nomineeObject.nomineeAddress.city = element?.address && element?.address?.city ? element?.address?.city : '';
          nomineeObject.nomineeAddress.pincode = element?.address && element?.address?.pincode ? element?.address?.pincode : '';
          nomineeObject.nomineeAddress.state =
            element?.address && element?.address?.state && element?.address?.state?.name ? element?.address?.state?.name : '';
          nomineeObject.nomineeAddress.stateId =
            element?.address && element?.address?.state && element?.address?.state?.id ? element?.address?.state?.id : null;
          nomineeObject.nomineeAddress.countryId =
            element?.address && element?.address?.state?.country && element?.address?.state?.country?.id
              ? element?.address?.state?.country?.id
              : null;
          nomineeObject.nomineeAddress.country =
            element?.address && element?.address?.state?.country && element?.address?.state?.country?.name
              ? element?.address?.state?.country?.name
              : '';

          nomineeObject.guardianRelationship = element.guardianRelationship;
          nomineeObject.guardianName = element.guardianName;
          nomineeObject.guardianPanCardNumber = element.guardianPanCardNumber ? element.guardianPanCardNumber : '';
          nomineeObject.guardianAddress.guardianAddressId =
            element.guardianAddress && element.guardianAddress.id ? element.guardianAddress.id : null;
          nomineeObject.guardianAddress.addressLine1 =
            element.guardianAddress && element.guardianAddress.addressLine1 ? element.guardianAddress.addressLine1 : '';
          nomineeObject.guardianAddress.addressLine2 =
            element.guardianAddress && element.guardianAddress.addressLine2 ? element.guardianAddress.addressLine2 : '';
          nomineeObject.guardianAddress.addressLine3 =
            element.guardianAddress && element.guardianAddress.addressLine3 ? element.guardianAddress.addressLine3 : '';
          nomineeObject.guardianAddress.landmark =
            element.guardianAddress && element.guardianAddress.landmark ? element.guardianAddress.landmark : '';
          nomineeObject.guardianAddress.city = element.guardianAddress && element.guardianAddress.city ? element.guardianAddress.city : '';
          nomineeObject.guardianAddress.pincode =
            element.guardianAddress && element.guardianAddress.pincode ? element.guardianAddress.pincode : '';
          nomineeObject.guardianAddress.stateId =
            element.guardianAddress && element.guardianAddress.state && element.guardianAddress.state.id
              ? element.guardianAddress.state.id
              : null;
          nomineeObject.guardianAddress.state =
            element.guardianAddress && element.guardianAddress.state && element.guardianAddress.state.name
              ? element.guardianAddress.state.name
              : '';
          nomineeObject.guardianAddress.countryId =
            element.guardianAddress &&
            element.guardianAddress.state &&
            element.guardianAddress.state.country &&
            element.guardianAddress.state.country.id
              ? element.guardianAddress.state.country.id
              : null;
          nomineeObject.guardianAddress.country =
            element.guardianAddress &&
            element.guardianAddress.state &&
            element.guardianAddress.state.country &&
            element.guardianAddress.state.country.name
              ? element.guardianAddress.state.country.name
              : '';
          nomineeData.push(nomineeObject);
        }
      }

      const uniqueNomineeData = uniqBy(nomineeData, 'nomineeAppUserId');
      return uniqueNomineeData;
    } catch (error) {
      LoggingUtils.error(error);
      throw error;
    }
  }

  async updateNomineeDetailsById(id: number, nomineeAppUserId: number, nominee: DataObject<InvestorNominee>): Promise<Object> {
    try {
      if (!nominee) {
        return Promise.reject(new RestError(400, 'Nominee Details required!', {systemcode: 1090}));
      }
      let collectiveResponses = await Promise.all([
        this.accountRepository.findOne({
          where: {
            id: id,
            isActive: true
          }
        }),
        this.investorNomineeRepository.findOne({
          where: {
            accountId: id,
            id: nominee.id,
            isActive: true
          },
          include: [
            {
              relation: 'address'
            },
            {
              relation: 'guardianAddress'
            }
          ]
        }),
        this.appUserRepository.findOne({
          where: {
            id: nomineeAppUserId,
            isActive: true
          }
        }),
        this.investorDetailsRepository.findOne({
          where: {
            appUserId: nomineeAppUserId,
            isActive: true
          }
        })
      ]).catch(err => {
        throw new Error(err);
      });

      const account: Account | null = collectiveResponses[0];

      const investorNominee: InvestorNominee | null = collectiveResponses[1];

      const user: AppUser | null = collectiveResponses[2];

      const investorDetails: InvestorDetails | null = collectiveResponses[3];

      //**** All the validations goes below */

      if (!account) {
        return Promise.reject(new RestError(404, 'Account not found', {systemcode: 1086}));
      }

      if (nominee.nomineePercentage && nominee.nomineePercentage > 100) {
        return Promise.reject(new RestError(465, 'Nominee percentage can\t be more than 100%', {systemcode: 1377}));
      }

      if (!investorNominee) {
        return Promise.reject(new RestError(404, 'Nominee details not found', {systemcode: 1378}));
      }

      if (!user) {
        return Promise.reject(new RestError(404, 'User not found', {systemcode: 1030}));
      }

      if (!investorDetails) {
        return Promise.reject(new RestError(404, 'Investor details not found', {systemcode: 1379}));
      }

      if (
        nominee.dateOfBirth &&
        moment(nominee.dateOfBirth).isValid() &&
        moment(moment().format('YYYY-MM-DD')).isSameOrBefore(moment(nominee.dateOfBirth).format('YYYY-MM-DD'))
      ) {
        return Promise.reject(new RestError(404, "Dob should be less than today's date", {systemcode: 1389}));
      }

      let ageInYear: number = this.getAge(nominee.dateOfBirth);

      if (nominee.name && !AppConstant.REGEX_ALPHABETS_WITH_SPACE.test(nominee.name)) {
        return Promise.reject(
          new RestError(404, "Nominee name shouldn't contains any special characters or numbers. Please update!!", {systemcode: 1390})
        );
      }

      if (nominee.guardianName && !AppConstant.REGEX_ALPHABETS_WITH_SPACE.test(nominee.guardianName) && ageInYear < 18) {
        return Promise.reject(
          new RestError(404, "Guardian name shouldn't contains any special characters or numbers. Please update!!", {systemcode: 1391})
        );
      }
      //**** Validations end */

      const nomineeInvestorDetailID = investorDetails && investorDetails?.id;

      let investorNomineeObj: Partial<InvestorNominee> = {};
      let nomineeId = investorNominee && investorNominee?.id;
      let isSyncedViaBank = investorNominee && investorNominee?.isSyncedViaBank;

      //** updating investor details */

      await this.investorDetailsRepository
        .updateById(nomineeInvestorDetailID, {
          birthDate: moment(new Date(nominee.dateOfBirth)).utcOffset('+05:30').format('YYYY-MM-DD') as any,
          investorTypeId: nominee.investorTypeId
        })
        .catch(err => {
          throw new Error(err);
        });

      //***** update name in appuser and address defatils only if nominee is not sync from bank ****/
      let createdGuardianAddressDetails: Partial<Address> = {};
      let createdAddressDetails: Partial<Address> = {};

      //** updating name in user */

      await this.appUserRepository.updateById(nomineeAppUserId, {name: nominee.name}).catch(err => {
        throw new Error(err);
      });

      let nomineeAddressId = investorNominee?.addressId;
      let guardianAddressId = investorNominee?.guardianAddressId;

      //** updating nominee address details */

      if (nominee && nominee.nomineeAddress && nomineeAddressId) {
        let nomineeAddress: Partial<Address> = {};
        nomineeAddress.addressLine1 =
          (nominee.nomineeAddress && nominee.nomineeAddress.addressLine1) || investorNominee.nomineeAddress.addressLine1 || '';
        nomineeAddress.addressLine2 = nominee.nomineeAddress.addressLine2 ;
        nomineeAddress.addressLine3 = nominee.nomineeAddress.addressLine3 ;
        // nomineeAddress.landmark =
        //   (nominee.nomineeAddress && nominee.nomineeAddress.landmark) || investorNominee.nomineeAddress.landmark || '';
        nomineeAddress.pincode = (nominee.nomineeAddress && nominee.nomineeAddress.pincode) || investorNominee.nomineeAddress.pincode || '';
        nomineeAddress.city = (nominee.nomineeAddress && nominee.nomineeAddress.city) || investorNominee.nomineeAddress.city || '';
        // nomineeAddress.district =
        //   (nominee.nomineeAddress && nominee.nomineeAddress.district) || investorNominee.nomineeAddress.district || '';
        nomineeAddress.stateId =
          (nominee.nomineeAddress && nominee.nomineeAddress.stateId) || investorNominee.nomineeAddress.stateId || null;
        await this.addressRepository.updateById(nomineeAddressId!, nomineeAddress).catch(err => {
          throw new Error(err);
        });
      } else {
        createdAddressDetails =  await this.addressRepository.create(nominee.nomineeAddress).catch(err => {
          throw new Error(err);
        });
      }

      //** updating guardian address details if user is minor */

      if (nominee && nominee.guardianAddress && guardianAddressId && ageInYear <= 18) {
        let guardianAddress: Partial<Address> = {};
        guardianAddress.addressLine1 =
          (nominee.guardianAddress && nominee.guardianAddress.addressLine1) || investorNominee.guardianAddress.addressLine1 || '';
        guardianAddress.addressLine2 = nominee.guardianAddress.addressLine2 ;
        guardianAddress.addressLine3 = nominee.guardianAddress.addressLine3 ;
        // guardianAddress.landmark =
        //   (nominee.guardianAddress && nominee.guardianAddress.landmark) || investorNominee.guardianAddress.landmark || '';
        guardianAddress.pincode =
          (nominee.guardianAddress && nominee.guardianAddress.pincode) || investorNominee.guardianAddress.pincode || '';
        guardianAddress.city = (nominee.guardianAddress && nominee.guardianAddress.city) || investorNominee.guardianAddress.city || '';
        // guardianAddress.district =
        //   (nominee.guardianAddress && nominee.guardianAddress.district) || investorNominee.guardianAddress.district || '';
        guardianAddress.stateId =
          (nominee.guardianAddress && nominee.guardianAddress.stateId) || investorNominee.guardianAddress.stateId || null;
        await this.addressRepository.updateById(guardianAddressId!, guardianAddress).catch(err => {
          throw new Error(err);
        });
      } else if (nominee.guardianAddress && !guardianAddressId && ageInYear <= 18) {
        createdGuardianAddressDetails = await this.addressRepository.create(nominee.guardianAddress).catch(err => {
          throw new Error(err);
        });
      }
      // }

      //** creating investor nominee object with all updation values by default */

      investorNomineeObj = {
        relationshipId: nominee?.relationshipId! || investorNominee?.relationshipId!,
        nomineePercentage: nominee?.nomineePercentage! || investorNominee?.nomineePercentage!
      };
      if (ageInYear < 18) {
        investorNomineeObj.guardianRelationship = nominee.guardianRelationship;
        investorNomineeObj.guardianName = nominee.guardianName;
        investorNomineeObj.guardianPanCardNumber = nominee.guardianPanCardNumber;
      } else {
        investorNomineeObj.guardianRelationship = null;
        investorNomineeObj.guardianName = null;
        investorNomineeObj.guardianPanCardNumber = null;
        investorNomineeObj.guardianAddressId = null!;
      }
      if (createdGuardianAddressDetails && createdGuardianAddressDetails.id && ageInYear < 18) {
        investorNomineeObj.guardianAddressId = createdGuardianAddressDetails.id;
      }

      //creating address if not present.
      if(createdAddressDetails && createdAddressDetails.id){
        investorNomineeObj.addressId = createdAddressDetails.id;
      }

      //** removing relationshipId in case of bank nominees */

      // if (isSyncedViaBank) {
      //   delete investorNomineeObj.relationshipId;
      // }

      //** updating investor nominee details */

      await this.investorNomineeRepository.updateById(nomineeId!, investorNomineeObj).catch(err => {
        throw new Error(err);
      });

      return Promise.resolve({success: true});
    } catch (err) {
      LoggingUtils.error(err.message);
      throw err;
    }
  }

  async getBankDetailsById(id: number, options?: Options): Promise<object> {
    type objectType = {
      accountNumber: string;
      accountType: string;
      ifscCode: string;
      holdingPattern: string;
    };
    type accountOpeningObjType = {
      accountType: string;
    };
    type MetaData = {
      accountOpening: Array<accountOpeningObjType>;
      mfRTA: Array<objectType>;
    };
    let metaData: MetaData = {accountOpening: [], mfRTA: []};
    let data: Array<objectType> = [];
    return new Promise((resolve, reject) => {
      this.accountRepository
        .findOne(
          {
            where: {
              id: id,
              isActive: true
            },
            include: [
              'holdingType',
              {
                relation: 'bankAccounts',
                scope: {
                  include: ['bankAccountType', 'bankBranch'],
                  where: {
                    isActive: true,
                    isDefault: true
                  }
                }
              }
            ]
          },
          options
        )
        .then((account: Account | null) => {
          if (!account) {
            return Promise.reject(new RestError(404, 'Account not found', {systemcode: 1086}));
          }
          if (account.bankAccounts && account.bankAccounts.length > 0) {
            account.bankAccounts.forEach((bankAccount: BankAccount) => {
              let object: objectType = {
                accountNumber: '',
                accountType: '',
                ifscCode: '',
                holdingPattern: ''
              };
              let accountOpeningObj: accountOpeningObjType = {
                accountType: ''
              };
              object.accountNumber = bankAccount.accountNumber;
              let type = bankAccount.bankAccountType && bankAccount.bankAccountType.name;
              object.accountType = type;
              object.ifscCode = bankAccount.bankBranch && bankAccount.bankBranch.ifscCode;
              object.holdingPattern = account.holdingType && account.holdingType.name;
              data.push(object);
              accountOpeningObj.accountType = type;
              metaData.mfRTA.push(object);
              metaData.accountOpening.push(accountOpeningObj);
            });
          }
          return resolve({data: data, metaData: metaData});
        })
        .catch(reject);
    });
  }

  async getBankBalanceByAccountId(accountId: number, transactionId: string, options?: Options): Promise<object> {
    return new Promise((resolve, reject) => {
      this.accountRepository
        .findOne({
          where: {
            id: accountId,
            isActive: true
          },
          include: [
            {
              relation: 'bankAccounts',
              scope: {
                where: {
                  isDefault: true
                }
              }
            }
          ]
        })
        .then((account: Account | null) => {
          if (!account) {
            return Promise.reject(new RestError(404, 'Account not found', {systemcode: 1086}));
          }
          if (account.bankAccounts && account.bankAccounts.length > 0) {
            let bankAccountNo = account?.bankAccounts[0]?.accountNumber;
            this.coreBankingRepository
              .fetchCASADetailBalanceInquiry(bankAccountNo, transactionId)
              .then((responseData: any) => {
                if (responseData && responseData.responseString && responseData.responseString.casaBalanceInquiryDetailsDTO) {
                  return resolve({
                    bankBalance: responseData.responseString.casaBalanceInquiryDetailsDTO.amtNetAvailBal,
                    bankAccountNo: bankAccountNo
                  });
                } else {
                  return reject(new RestError(400, 'BankAccount details not available!', {systemcode: 1106}));
                }
              })
              .catch((err: Error) => {
                LoggingUtils.error(err);
                return reject(err);
              });
          }
        })
        .catch((err: Error) => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  async getNomineesById(id: number, options?: Options): Promise<object> {
    let data: any = [];
    return new Promise((resolve, reject) => {
      this.investorNomineeRepository
        .find(
          {
            where: {
              accountId: id,
              isActive: true
            },
            include: [
              {
                relation: 'appUser',
                scope: {
                  include: ['investorDetails']
                }
              },
              {
                relation: 'bankAccount',
                scope: {
                  where: {
                    accountId: id,
                    isActive: true
                  }
                }
              },
              'relationship',
              {
                relation: 'serviceProviderAccount',
                scope: {
                  where: {
                    accountId: id,
                    isActive: true
                  }
                }
              }
            ]
          },
          options
        )
        .then(nominees => {
          if (!nominees) {
            return Promise.reject(new RestError(404, 'Nominees are not found', {systemcode: 1108}));
          }
          nominees.forEach((element: InvestorNominee) => {
            let object: any = {};
            object.name = element.appUser && element.appUser.name;
            object.relationshipName = element.relationship && element.relationship.name;
            object.nomineePercentage = element.nomineePercentage;
            object.dateOfBirth =
              element.appUser &&
              element.appUser.investorDetails &&
              moment(element.appUser?.investorDetails?.birthDate).format('YYYY-MM-DD');
            data.push(object);
          });
          return resolve(data);
        })
        .catch((err: Error) => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  async getBankAccountsByAccountId(id: number, options?: Options): Promise<object> {
    let data: any = [];
    return new Promise((resolve, reject) => {
      this.accountRepository
        .findOne(
          {
            where: {
              id: id,
              isActive: true
            },
            include: [
              {
                relation: 'bankAccounts',
                scope: {
                  where: {
                    bankAccountStatus: 1, //@TODO NEED TO GET IT FROM OPTION.TS
                    isActive: true
                  },
                  include: ['bankAccountType', 'bankBranch', 'holdingType']
                }
              }
            ]
          },
          options
        )
        .then((account: Account | null) => {
          if (!account) {
            return Promise.reject(new RestError(404, 'Account not found', {systemcode: 1086}));
          }
          if (account.bankAccounts && account.bankAccounts.length > 0) {
            account.bankAccounts.forEach((bankAccount: BankAccount) => {
              if (bankAccount.holdingTypeId != 2) {
                let object: any = {};
                object.accountNumber = bankAccount.accountNumber;
                let type = bankAccount.bankAccountType && bankAccount.bankAccountType.name;
                object.id = bankAccount.id;
                object.accountType = type;
                object.accountName = bankAccount.accountName;
                object.branchName = bankAccount.bankBranch && bankAccount.bankBranch.branchName;
                object.holdingPattern = bankAccount.holdingType && bankAccount.holdingType.name;
                object.holdingPatternId = bankAccount.holdingType && bankAccount.holdingType.id;
                object.isDefault = bankAccount.isDefault;
                object.isActive = bankAccount.isActive;
                data.push(object);
              }
            });
          }
          return resolve(data);
        })
        .catch((err: Error) => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  async fetchFolioByAccountId(accountId: number, instrumentId: number, options?: Options): Promise<any> {
    return new Promise((resolve, reject) => {
      type returnType = {
        serviceProviderAccountNumber: string;
        serviceProviderAccountId: number;
        existingInvestment: number;
        isHeldAway: boolean;
      };
      let returnData: Array<returnType> = [];
      // check if holding exist
      this.holdingRepository
        .find(
          {
            where: {
              instrumentId: instrumentId,
              isActive: true,
              goalId: null
            },
            include: [
              {
                relation: 'serviceProviderAccount'
              }
            ]
          },
          options
        )
        .then((holdings: Array<Holding>): Promise<Instrument | null> => {
          holdings.forEach(holding => {
            if (holding.serviceProviderAccount && holding.serviceProviderAccount.accountId === accountId && holding.serviceProviderAccount.isHeldAway == false) {
              returnData.push({
                serviceProviderAccountNumber: holding.serviceProviderAccount.accountNumber,
                serviceProviderAccountId: holding.serviceProviderAccount.id!,
                existingInvestment: 1,
                isHeldAway: holding.serviceProviderAccount.isHeldAway
              });
            }
          });
          return this.instrumentRepository.findOne(
            {
              where: {
                id: instrumentId,
                isActive: true
              }
            },
            options
          );
        })
        .then((instrument: Instrument | null): Promise<Array<ServiceProviderAccount>> => {
          if (!instrument) {
            return Promise.reject(new RestError(404, 'Instrument Not Found', {systemcode: 1110}));
          }
          return this.serviceProviderAccountRepository.find(
            {
              where: {
                accountId: accountId,
                serviceProviderId: instrument.serviceProviderId,
                isActive: true,
                isHeldAway: false
              }
            },
            options
          );
        })
        .then((serviceProviderAccounts: Array<ServiceProviderAccount>) => {
          if (serviceProviderAccounts.length) {
            serviceProviderAccounts.forEach(serviceProviderAccount => {
              let foundServiceProviderAccount = returnData.find((spAccount: any) => {
                if (spAccount.serviceProviderAccountNumber === serviceProviderAccount.accountNumber) {
                  return spAccount;
                }
              });
              if (!foundServiceProviderAccount) {
                returnData.push({
                  serviceProviderAccountNumber: serviceProviderAccount.accountNumber,
                  serviceProviderAccountId: serviceProviderAccount.id!,
                  existingInvestment: 0,
                  isHeldAway: serviceProviderAccount.isHeldAway
                });
              }
            });
          }
          return resolve(returnData);
        })
        .catch(error => {
          LoggingUtils.error(error);
          return reject(error);
        });
    });
  }

  async updateRiskProfileByAccountId(accountId: number, riskProfileId: number, options?: Options): Promise<Account> {
    return new Promise((resolve, reject) => {
      let accountData: Account;
      let riskProfileData: RiskProfile;
      // Flag to identify wether to send set risk profile  or modify risk profile
      let sendUpdateNotification: boolean = false;
      this.accountRepository
        .findOne(
          {
            where: {
              id: accountId,
              isActive: true
            },
            include: ['riskProfile', 'primaryHolder']
          },
          options
        )
        .then((account: Account | null) => {
          if (!account) {
            return Promise.reject(new RestError(404, 'Account Not Found', {systemcode: 1086}));
          }
          accountData = account;
          // fetching new riskProfile ID.
          sendUpdateNotification = accountData.riskProfileId === null || accountData.riskProfileId === 0 ? false : true;
          return this.riskProfileRepository.findOne(
            {
              where: {
                id: riskProfileId,
                isActive: true
              }
            },
            options
          );
        })
        .then((riskProfile: RiskProfile | null) => {
          if (!riskProfile) {
            return Promise.reject(new RestError(404, 'Risk Profile Not Found', {systemcode: 1113}));
          }
          riskProfileData = riskProfile;
          return this.accountRepository.updateAll(
            {
              riskProfileId: riskProfileId,
              riskProfileUpdatedDate: new Date()
            },
            {
              id: accountData.id,
              isActive: true
            }
          );
        })
        .then(async () => {
          if (sendUpdateNotification) {
            //Modify riskProfile
            await NotificationUtils.sendNotificationEvent({
              accountId: accountId,
              topicId: NotificationTopics.TOPICS.riskProfile.modify.value,
              notificationType: NotificationTopics.TOPICS.riskProfile.modify.topic,
              templateKeys: {
                customerName: accountData.name,
                date: moment().format('DD/MM/YY'),
                emailId: 'mailto:smartwealth@hdfcbank.com',
                fromRiskProfileName: accountData.riskProfile.name,
                toRiskProfileName: riskProfileData.name
              }
            });
          } else {
            //Set riskProfile
            await NotificationUtils.sendNotificationEvent({
              accountId: accountId,
              topicId: NotificationTopics.TOPICS.riskProfile.set.value,
              notificationType: NotificationTopics.TOPICS.riskProfile.set.topic,
              templateKeys: {
                riskProfileName: riskProfileData.name,
                link: '',
                customerName: accountData.name,
                date: moment().format('DD/MM/YY'),
                emailId: 'mailto:smartwealth@hdfcbank.com'
              }
            });
          }
          return this.accountRepository.findOne(
            {
              where: {
                id: accountId,
                isActive: true
              }
            },
            options
          );
        })
        .then(async account => {
          if (!account) {
            return Promise.reject(new RestError(404, 'Account Not Found'));
          }
          await this.dataRefreshByAccountId(account.id!);
          return resolve(account);
        })
        /*.then(account => {
          if (!account) {
            return Promise.reject(new RestError(404, 'Account Not Found', {systemcode: 1086}));
          }
          return resolve(account);
        })*/
        .catch((err: any) => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  async updateSkippedNomineeById(id: number, skippedNomineeRequest: skippedNomineeType, options: Option): Promise<any> {
    //update the skipe nominee
    return new Promise(async (resolve, reject) => {
      await this.markNomineeDetailsAsUpdated(id, options);
      if (!skippedNomineeRequest || skippedNomineeRequest!.skippedNominee == null)
        return Promise.reject(new RestError(400, 'Invalid request body', {systemcode: 1114}));
      this.accountRepository
        .findOne({
          where: {
            id: id,
            isActive: true
          }
        })
        .then(account => {
          if (!account) {
            return Promise.reject(new RestError(404, 'Account not found', {systemcode: 1086}));
          }
          account.skippedNominee = skippedNomineeRequest.skippedNominee;
          return this.accountRepository.save(account);
        })
        .then(accountData => {
          // update primary user status
          return this.appUserRepository.updateAll(
            {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['nomineeCompleted'].value},
            {id: accountData.primaryHolderId, isActive: true}
          );
        })
        .then(() => {
          resolve({success: true});
        })
        .catch(err => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  /**
   * Method to send message to transcation refresher Queue
   * @param id
   * @returns
   */
  async dataRefreshByAccountId(id: number): Promise<any> {
    try {
      let message = new TransactionalDataRefreshingQueueMessage();
      message.eventType = TransactionalDataRefreshingQueueMessageEventType.DATA_REFRESH_BY_ACCOUNT_ID;
      message.accountId = id;
      await QueueProducer.sendMessageInTransactionalDataRefreshingQueue(message).catch(err => {
        throw new Error(err);
      });
      return {success: true};
    } catch (error) {
      LoggingUtils.error('Some Error Occured');
      return new RestError(400, 'Error occured while sending Message Queue', {systemcode: 1010});
    }
  }

  /**
   * Method to send message to Fatca generation Queue
   * @param id
   * @returns
   */
  async fatcaGenerationByAccountId(id: number): Promise<any> {
    try {
      let message = new TransactionalDataRefreshingQueueMessage();
      message.eventType = TransactionalDataRefreshingQueueMessageEventType.FATCA_FILE_GENERATION_BY_ACCOUNT_ID;
      message.accountId = id;
      await QueueProducer.sendMessageInTransactionalDataRefreshingQueue(message).catch(err => {
        throw new Error(err);
      });
      return {success: true};
    } catch (error) {
      LoggingUtils.error('Some Error Occured');
      return new RestError(400, 'Error occured while sending Message Queue', {systemcode: 1010});
    }
  }

  async exportInvestorMaster(filter: Filter<Account>, exportFormat: string, res: Response, options?: Options): Promise<any> {
    try {
      let xlsHeaders: any[] = [
        {header: 'Investor ID', key: 'Investor ID', width: 32},
        {header: 'Bank Customer ID', key: 'Primary Holder BosCode', width: 32},
        {header: 'Registration Status', key: 'Registration Status', width: 32},
        {header: 'AOF Status', key: 'AOF_STATUS', width: 32},
        {header: 'Primary Holder Name', key: 'Primary Holder Name', width: 32},
        {header: 'Primary Holder Contact', key: 'Primary Holder Contact', width: 32},
        {header: 'Primary Holder Email', key: 'Primary Holder Email', width: 32},
        {header: 'Primary Holder PAN', key: 'Primary Holder PAN', width: 32},
        {header: 'Primary Holder DOB', key: 'Primary Holder DOB', width: 32},
        {header: 'Primary Holder KYC Status', key: 'Primary Holder KYC Status', width: 32},
        {header: 'Primary Holder FATCA Status', key: 'Primary Holder FATCA Status', width: 32},
        {header: 'Primary Holder FATCA Gender', key: 'Primary Holder FATCA Gender', width: 32},
        {header: 'Primary Holder Onboarding Date', key: 'Primary Holder Onboarding Date', width: 32},
        {header: 'Primary Holder Place of Birth', key: 'Primary Holder Place of Birth', width: 32},
        {header: 'Primary Holder Country of Birth ', key: 'Primary Holder Country of Birth', width: 32},
        {header: 'Primary Holder Occupation', key: 'Primary Holder Occupation', width: 32},
        {header: 'Primary Holder Politically Exposed', key: 'Primary Holder Politically Exposed', width: 32},
        {header: 'Primary Holder Wealth Source', key: 'Primary Holder Wealth Source', width: 32},
        {header: 'Primary Holder Income Slab', key: 'Primary Holder Income Slab', width: 32},
        {header: 'Primary Holder Tax Resident Outside India', key: 'Primary Holder Tax Resident Outside India', width: 32},
        {header: 'Primary Holder Tax Resident Country', key: 'Primary Holder Tax Resident Country', width: 32},
        {header: 'Secondary Holder Name', key: 'Secondary Holder Name', width: 32},
        {header: 'Secondary Holder Contact', key: 'Secondary Holder Contact', width: 32},
        {header: 'Secondary Holder Email', key: 'Secondary Holder Email', width: 32},
        {header: 'Secondary Holder PAN ', key: 'Secondary Holder PAN ', width: 32},
        {header: 'Secondary Holder DOB', key: 'Secondary Holder DOB', width: 32},
        {header: 'Secondary Holder KYC Status', key: 'Secondary Holder KYC Status', width: 32},
        {header: 'Secondary Holder FATCA Status', key: 'Secondary Holder FATCA Status', width: 32},
        {header: 'Secondary Holder FATCA Gender', key: 'Secondary Holder FATCA Gender', width: 32},
        {header: 'Secondary Holder Onboarding Date', key: 'Secondary Holder Onboarding Date', width: 32},
        {header: 'Secondary Holder Place of Birth', key: 'Secondary Holder Place of Birth', width: 32},
        {header: 'Secondary Holder Country of Birth ', key: 'Secondary Holder Country of Birth ', width: 32},
        {header: 'Secondary Holder Occupation', key: 'Secondary Holder Occupation', width: 32},
        {header: 'Secondary Holder Politically Exposed', key: 'Secondary Holder Politically Exposed', width: 32},
        {header: 'Secondary Holder Wealth Source', key: 'Secondary Holder Wealth Source', width: 32},
        {header: 'Secondary Holder Income Slab', key: 'Secondary Holder Income Slab', width: 32},
        {header: 'Secondary Holder Tax Resident Outside India', key: 'Secondary Holder Tax Resident Outside India', width: 32},
        {header: 'Secondary Holder Tax Resident Country', key: 'Secondary Holder Tax Resident Country', width: 32},
        {header: 'Tertiary Holder Name', key: 'Tertiary Holder Name', width: 32},
        {header: 'Tertiary Holder Contact', key: 'Tertiary Holder Contact', width: 32},
        {header: 'Tertiary Holder Email', key: 'Tertiary Holder Email', width: 32},
        {header: 'Tertiary Holder PAN', key: 'Tertiary Holder PAN', width: 32},
        {header: 'Tertiary Holder DOB', key: 'Tertiary Holder DOB', width: 32},
        {header: 'Tertiary Holder KYC Status', key: 'Tertiary Holder KYC Status', width: 32},
        {header: 'Tertiary Holder FATCA Status', key: 'Tertiary Holder FATCA Status', width: 32},
        {header: 'Tertiary Holder FATCA Gender', key: 'Tertiary Holder FATCA Gender', width: 32},
        {header: 'Tertiary Holder Onboarding Date', key: 'Tertiary Holder Onboarding Date', width: 32},
        {header: 'Tertiary Holder Place of Birth', key: 'Tertiary Holder Place of Birth', width: 32},
        {header: 'Tertiary Holder Country of Birth ', key: 'Tertiary Holder Country of Birth ', width: 32},
        {header: 'Tertiary Holder Occupation', key: 'Tertiary Holder Occupation', width: 32},
        {header: 'Tertiary Holder Politically Exposed', key: 'Tertiary Holder Politically Exposed', width: 32},
        {header: 'Tertiary Holder Wealth Source', key: 'Tertiary Holder Wealth Source', width: 32},
        {header: 'Tertiary Holder Income Slab', key: 'Tertiary Holder Income Slab', width: 32},
        {header: 'Tertiary Holder Tax Resident Outside India', key: 'Tertiary Holder Tax Resident Outside India', width: 32},
        {header: 'Tertiary Holder Tax Resident Country', key: 'Tertiary Holder Tax Resident Country', width: 32},
        {header: 'Activation Date', key: 'Activation Date', width: 32},
        {header: 'Date Of Onboarding', key: 'Date Of Onboarding', width: 32},
        {header: 'Risk Profile', key: 'Risk Profile', width: 32}
      ];
      const rawdata = await this.investorMasterDetails(filter, options!);
      let nomineeHeaders: any[] = [];
      let bankAccountHeaders: any[] = [];

      let xls = map(rawdata.data, (data: Account & AccountRelations) => {
        let xlsFormat: any = {};

        const primaryHolder = data.primaryHolder;
        const secondaryHolder = data.secondaryHolder;
        const tertiaryHolder = data.tertiaryHolder;
        const investorNominees = data.investorNominees ? data.investorNominees : null;
        const bankAccounts: any = data.bankAccounts ? (data.bankAccounts.length > 0 ? data.bankAccounts! : null) : null;
        const riskProfile = data.riskProfile;
        // console.log(data)
        const accountAppFileMapping: any = data?.accountAppFileMapping;
        xlsFormat['Investor ID'] = data.uniqueId;

        xlsFormat['Primary Holder BosCode'] = primaryHolder ? (primaryHolder.bosCode ? primaryHolder.bosCode : '') : '';

        xlsFormat['Registration Status'] = primaryHolder ? (primaryHolder.appUserStatusLabel ? primaryHolder.appUserStatusLabel : '') : '';
        xlsFormat['Primary Holder Name'] = primaryHolder ? primaryHolder.name : '';
        xlsFormat['Primary Holder Contact'] = primaryHolder ? primaryHolder.contactNumber : '';
        xlsFormat['Primary Holder Email'] = primaryHolder ? primaryHolder.email : '';
        xlsFormat['Primary Holder PAN'] = primaryHolder
          ? primaryHolder.investorDetails
            ? primaryHolder.investorDetails.panCardNumber
              ? primaryHolder.investorDetails.panCardNumber
              : ''
            : ''
          : '';
        xlsFormat['Primary Holder DOB'] = primaryHolder
          ? primaryHolder.investorDetails
            ? primaryHolder.investorDetails.birthDate
              ? moment(primaryHolder.investorDetails.birthDate).format('DD-MMM-YYYY')
              : ''
            : ''
          : '';
        xlsFormat['Primary Holder KYC Status'] = primaryHolder
          ? primaryHolder.investorDetails
            ? primaryHolder.investorDetails.kycStatusLabel
              ? primaryHolder.investorDetails.kycStatusLabel
              : ''
            : ''
          : '';
        xlsFormat['Primary Holder FATCA Status'] = primaryHolder
          ? primaryHolder.investorDetails
            ? primaryHolder.investorDetails.fatcaRegistrationStatusLabel
              ? primaryHolder.investorDetails.fatcaRegistrationStatusLabel
              : ''
            : ''
          : '';

        xlsFormat['Primary Holder FATCA Gender'] = primaryHolder ? primaryHolder.genderLabel : '';
        xlsFormat['Primary Holder Onboarding Date'] = primaryHolder ? moment(primaryHolder.createdDate).format('DD-MMM-YYYY') : '';
        xlsFormat['Primary Holder Place of Birth'] = primaryHolder
          ? primaryHolder.investorDetails
            ? primaryHolder.investorDetails.birthCity
              ? primaryHolder.investorDetails.birthCity
              : ''
            : ''
          : '';

        xlsFormat['Primary Holder Country of Birth'] = primaryHolder
          ? primaryHolder.investorDetails
            ? primaryHolder.investorDetails.countryOfBirth
              ? primaryHolder.investorDetails.countryOfBirth.name
                ? primaryHolder.investorDetails.countryOfBirth.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Primary Holder Occupation'] = primaryHolder
          ? primaryHolder.investorDetails
            ? primaryHolder.investorDetails.occupation
              ? primaryHolder.investorDetails.occupation.name
                ? primaryHolder.investorDetails.occupation.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Primary Holder Politically Exposed'] = primaryHolder
          ? primaryHolder.investorDetails
            ? primaryHolder.investorDetails.politicallyExposureType
              ? primaryHolder.investorDetails.politicallyExposureType.name
                ? primaryHolder.investorDetails.politicallyExposureType.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Primary Holder Wealth Source'] = primaryHolder
          ? primaryHolder.investorDetails
            ? primaryHolder.investorDetails.wealthSource
              ? primaryHolder.investorDetails.wealthSource.name
                ? primaryHolder.investorDetails.wealthSource.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Primary Holder Income Slab'] = primaryHolder
          ? primaryHolder.investorDetails
            ? primaryHolder.investorDetails.incomeSlab
              ? primaryHolder.investorDetails.incomeSlab.name
                ? primaryHolder.investorDetails.incomeSlab.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Primary Holder Tax Resident Outside India'] = primaryHolder
          ? primaryHolder.investorDetails
            ? primaryHolder.investorDetails.taxResidentCountryId
              ? primaryHolder.investorDetails.taxResidentCountryId
                ? primaryHolder.investorDetails.taxResidentCountryId !== 106
                  ? 'Yes'
                  : 'NO'
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Primary Holder Tax Resident Country'] = primaryHolder
          ? primaryHolder.investorDetails
            ? primaryHolder.investorDetails.taxResidentCountry
              ? primaryHolder.investorDetails.taxResidentCountry.name
                ? primaryHolder.investorDetails.taxResidentCountry.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Secondary Holder Name'] = secondaryHolder ? secondaryHolder.name : '';
        xlsFormat['Secondary Holder Contact'] = secondaryHolder ? secondaryHolder.contactNumber : '';
        xlsFormat['Secondary Holder Email'] = secondaryHolder ? secondaryHolder.email : '';
        xlsFormat['Secondary Holder PAN  '] = secondaryHolder
          ? secondaryHolder.investorDetails
            ? secondaryHolder.investorDetails.panCardNumber
              ? secondaryHolder.investorDetails.panCardNumber
              : ''
            : ''
          : '';
        xlsFormat['Secondary Holder DOB'] = secondaryHolder
          ? secondaryHolder.investorDetails
            ? secondaryHolder.investorDetails.birthDate
              ? moment(secondaryHolder.investorDetails.birthDate).format('DD-MMM-YYYY')
              : ''
            : ''
          : '';
        xlsFormat['Secondary Holder KYC Status'] = secondaryHolder
          ? secondaryHolder.investorDetails
            ? secondaryHolder.investorDetails.kycStatusLabel
              ? secondaryHolder.investorDetails.kycStatusLabel
              : ''
            : ''
          : '';
        xlsFormat['Secondary Holder FATCA Status'] = secondaryHolder
          ? secondaryHolder.investorDetails
            ? secondaryHolder.investorDetails.fatcaRegistrationStatusLabel
              ? secondaryHolder.investorDetails.fatcaRegistrationStatusLabel
              : ''
            : ''
          : '';
        xlsFormat['Secondary Holder FATCA Gender'] = secondaryHolder ? secondaryHolder.genderLabel : '';
        xlsFormat['Secondary Holder Onboarding Date'] = secondaryHolder ? moment(secondaryHolder.createdDate).format('DD-MMM-YYYY') : '';

        xlsFormat['Secondary Holder Place of Birth'] = secondaryHolder
          ? secondaryHolder.investorDetails
            ? secondaryHolder.investorDetails.stateOfBirth
              ? secondaryHolder.investorDetails.stateOfBirth.name
                ? secondaryHolder.investorDetails.stateOfBirth.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Secondary Holder Country of Birth'] = secondaryHolder
          ? secondaryHolder.investorDetails
            ? secondaryHolder.investorDetails.countryOfBirth
              ? secondaryHolder.investorDetails.countryOfBirth.name
                ? secondaryHolder.investorDetails.countryOfBirth.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Secondary Holder Occupation'] = secondaryHolder
          ? secondaryHolder.investorDetails
            ? secondaryHolder.investorDetails.occupation
              ? secondaryHolder.investorDetails.occupation.name
                ? secondaryHolder.investorDetails.occupation.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Secondary Holder Politically Exposed'] = secondaryHolder
          ? secondaryHolder.investorDetails
            ? secondaryHolder.investorDetails.politicallyExposureType
              ? secondaryHolder.investorDetails.politicallyExposureType.name
                ? secondaryHolder.investorDetails.politicallyExposureType.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Secondary Holder Wealth Source'] = secondaryHolder
          ? secondaryHolder.investorDetails
            ? secondaryHolder.investorDetails.wealthSource
              ? secondaryHolder.investorDetails.wealthSource.name
                ? secondaryHolder.investorDetails.wealthSource.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Secondary Holder Income Slab'] = secondaryHolder
          ? secondaryHolder.investorDetails
            ? secondaryHolder.investorDetails.incomeSlab
              ? secondaryHolder.investorDetails.incomeSlab.name
                ? secondaryHolder.investorDetails.incomeSlab.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Secondary Holder Tax Resident Outside India'] = secondaryHolder
          ? secondaryHolder.investorDetails
            ? secondaryHolder.investorDetails.taxResidentCountryId
              ? secondaryHolder.investorDetails.taxResidentCountryId
                ? secondaryHolder.investorDetails.taxResidentCountryId !== 106
                  ? 'Yes'
                  : 'NO'
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Secondary Holder Tax Resident Country'] = secondaryHolder
          ? secondaryHolder.investorDetails
            ? secondaryHolder.investorDetails.taxResidentCountry
              ? secondaryHolder.investorDetails.taxResidentCountry.name
                ? secondaryHolder.investorDetails.taxResidentCountry.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Tertiary Holder Name'] = tertiaryHolder ? tertiaryHolder.name : '';
        xlsFormat['Tertiary Holder Contact'] = tertiaryHolder ? tertiaryHolder.contactNumber : '';
        xlsFormat['Tertiary Holder Email'] = tertiaryHolder ? tertiaryHolder.email : '';
        xlsFormat['Tertiary Holder PAN'] = tertiaryHolder
          ? tertiaryHolder.investorDetails
            ? tertiaryHolder.investorDetails.panCardNumber
              ? tertiaryHolder.investorDetails.panCardNumber
              : ''
            : ''
          : '';
        xlsFormat['Tertiary Holder DOB'] = tertiaryHolder
          ? tertiaryHolder.investorDetails
            ? tertiaryHolder.investorDetails.birthDate
              ? moment(tertiaryHolder.investorDetails.birthDate).format('DD-MMM-YYYY')
              : ''
            : ''
          : '';
        xlsFormat['Tertiary Holder KYC Status'] = tertiaryHolder
          ? tertiaryHolder.investorDetails
            ? tertiaryHolder.investorDetails.kycStatusLabel
              ? tertiaryHolder.investorDetails.kycStatusLabel
              : ''
            : ''
          : '';
        xlsFormat['Tertiary Holder FATCA Status '] = tertiaryHolder
          ? tertiaryHolder.investorDetails
            ? tertiaryHolder.investorDetails.fatcaRegistrationStatusLabel
              ? tertiaryHolder.investorDetails.fatcaRegistrationStatusLabel
              : ''
            : ''
          : '';
        xlsFormat['Tertiary Holder FATCA Gender'] = tertiaryHolder ? tertiaryHolder.genderLabel : '';
        xlsFormat['Tertiary Holder Onboarding Date'] = tertiaryHolder ? moment(tertiaryHolder.createdDate).format('DD-MMM-YYYY') : '';

        xlsFormat['Tertiary Holder Place of Birth'] = tertiaryHolder
          ? tertiaryHolder.investorDetails
            ? tertiaryHolder.investorDetails.stateOfBirth
              ? tertiaryHolder.investorDetails.stateOfBirth.name
                ? tertiaryHolder.investorDetails.stateOfBirth.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Tertiary Holder Country of Birth'] = tertiaryHolder
          ? tertiaryHolder.investorDetails
            ? tertiaryHolder.investorDetails.countryOfBirth
              ? tertiaryHolder.investorDetails.countryOfBirth.name
                ? tertiaryHolder.investorDetails.countryOfBirth.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Tertiary Holder Occupation'] = tertiaryHolder
          ? tertiaryHolder.investorDetails
            ? tertiaryHolder.investorDetails.occupation
              ? tertiaryHolder.investorDetails.occupation.name
                ? tertiaryHolder.investorDetails.occupation.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Tertiary Holder Politically Exposed'] = tertiaryHolder
          ? tertiaryHolder.investorDetails
            ? tertiaryHolder.investorDetails.politicallyExposureType
              ? tertiaryHolder.investorDetails.politicallyExposureType.name
                ? tertiaryHolder.investorDetails.politicallyExposureType.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Tertiary Holder Wealth Source'] = tertiaryHolder
          ? tertiaryHolder.investorDetails
            ? tertiaryHolder.investorDetails.wealthSource
              ? tertiaryHolder.investorDetails.wealthSource.name
                ? tertiaryHolder.investorDetails.wealthSource.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Tertiary Holder Income Slab'] = tertiaryHolder
          ? tertiaryHolder.investorDetails
            ? tertiaryHolder.investorDetails.incomeSlab
              ? tertiaryHolder.investorDetails.incomeSlab.name
                ? tertiaryHolder.investorDetails.incomeSlab.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Tertiary Holder Tax Resident Outside India'] = tertiaryHolder
          ? tertiaryHolder.investorDetails
            ? tertiaryHolder.investorDetails.taxResidentCountryId
              ? tertiaryHolder.investorDetails.taxResidentCountryId
                ? tertiaryHolder.investorDetails.taxResidentCountryId !== 106
                  ? 'Yes'
                  : 'NO'
                : ''
              : ''
            : ''
          : '';

        xlsFormat['Tertiary Holder Tax Resident Country'] = tertiaryHolder
          ? tertiaryHolder.investorDetails
            ? tertiaryHolder.investorDetails.taxResidentCountry
              ? tertiaryHolder.investorDetails.taxResidentCountry.name
                ? tertiaryHolder.investorDetails.taxResidentCountry.name
                : ''
              : ''
            : ''
          : '';

        xlsFormat['AOF_STATUS'] = 'NO';
        if (accountAppFileMapping != undefined) {
          for (let item of accountAppFileMapping)
            if (
              item?.userManagementAppFile?.isActive == true &&
              item?.userManagementAppFile?.containerName == FileStorageContainerConfig.getGcpContainerName('aof')
            ) {
              xlsFormat['AOF_STATUS'] = 'YES';
            }
        }
        // investor nominee check
        if (investorNominees !== null) {
          investorNominees.forEach((investorNominee: any, key: number) => {
            let xlsFormatn: any = {};
            if (key < 3) {
              xlsFormatn[`Nominee ${key + 1} Name`] = investorNominee.appUser ? investorNominee.appUser.name : '';
              xlsFormatn[`Nominee ${key + 1} Relationship`] = investorNominee
                ? investorNominee.relationship
                  ? investorNominee.relationship.name
                    ? investorNominee.relationship.name
                    : ''
                  : ''
                : '';
              xlsFormatn[`Nominee ${key + 1} Status`] = investorNominee
                ? investorNominee.appUser
                  ? investorNominee.appUser.appUserStatusLabel
                    ? investorNominee.appUser.appUserStatusLabel
                    : ''
                  : ''
                : '';
              xlsFormatn[`Nominee ${key + 1} Percentage`] = investorNominee ? investorNominee.nomineePercentage : '';
              xlsFormatn[`Nominee ${key + 1} Guardian Name`] = investorNominee ? investorNominee.guardianName : '';
              xlsFormatn[`Nominee ${key + 1} Guardian Relationship`] = investorNominee ? investorNominee.guardianRelationshipLabel : '';
              // Adding nominee data and headers
              xlsFormat = {...xlsFormat, ...xlsFormatn};
              nomineeHeaders = [
                ...nomineeHeaders,
                {header: `Nominee ${key + 1} Name`, key: `Nominee ${key + 1} Name`, width: 32},
                {header: `Nominee ${key + 1} Relationship`, key: `Nominee ${key + 1} Relationship`, width: 32},
                {header: `Nominee ${key + 1} Status`, key: `Nominee ${key + 1} Status`, width: 32},
                {header: `Nominee ${key + 1} Percentage`, key: `Nominee ${key + 1} Percentage`, width: 32},
                {header: `Nominee ${key + 1} Guardian Name`, key: `Nominee ${key + 1} Guardian Name`, width: 32},
                {header: `Nominee ${key + 1} Guardian Relationship`, key: `Nominee ${key + 1} Guardian Relationship`, width: 32}
              ];
            }
          });
        }
        //Bank account check
        if (bankAccounts !== null) {
          bankAccounts.forEach((bankAccount: any, key: number) => {
            let xlsFormatb: any = {};
            xlsFormatb[`Bank Account ${key + 1} Holder Name`] = bankAccount ? bankAccount.accountName : '';
            xlsFormatb[`Bank Account ${key + 1} Name`] = bankAccount
              ? bankAccount.bankBranch
                ? bankAccount.bankBranch.bank
                  ? bankAccount.bankBranch.bank.name
                    ? bankAccount.bankBranch.bank.name
                    : ''
                  : ''
                : ''
              : '';
            xlsFormatb[`Bank Account ${key + 1} Type`] = bankAccount
              ? bankAccount.bankAccountType
                ? bankAccount.bankAccountType.name
                  ? bankAccount.bankAccountType.name
                  : ''
                : ''
              : '';
            xlsFormatb[`Bank Account ${key + 1} Branch Name`] = bankAccount.bankBranch ? bankAccount.bankBranch.branchName : '';
            xlsFormatb[`Bank Account ${key + 1} Number`] = bankAccount ? bankAccount.accountNumber : '';
            xlsFormatb[`Bank Account ${key + 1} IFSC Code`] = bankAccount.bankBranch ? bankAccount.bankBranch.ifscCode : '';
            //Adding bankaccount data and headers
            xlsFormat = {...xlsFormat, ...xlsFormatb};
            bankAccountHeaders = [
              ...bankAccountHeaders,
              {header: `Bank Account ${key + 1} Holder Name`, key: `Bank Account ${key + 1} Holder Name`, width: 32},
              {header: `Bank Account ${key + 1} Name`, key: `Bank Account ${key + 1} Name`, width: 32},
              {header: `Bank Account ${key + 1} Type`, key: `Bank Account ${key + 1} Type`, width: 32},
              {header: `Bank Account ${key + 1} Branch Name`, key: `Bank Account ${key + 1} Branch Name`, width: 32},
              {header: `Bank Account ${key + 1} Number`, key: `Bank Account ${key + 1} Number`, width: 32},
              {header: `Bank Account ${key + 1} IFSC Code`, key: `Bank Account ${key + 1} IFSC Code`, width: 32}
            ];
          });
        }

        xlsFormat['Activation Date'] = data.activationDate ? moment(data.activationDate).format('DD-MMM-YYYY') : '';
        xlsFormat['Date Of Onboarding'] = data.createdDate ? moment(data.createdDate).format('DD-MMM-YYYY') : '';
        xlsFormat['Risk Profile'] = riskProfile ? riskProfile.name : '';
        return xlsFormat;
      });
      if (exportFormat === 'xlsx') {
        res.append('fileName', 'HoldingsReport.xlsx');
        xlsHeaders = [...xlsHeaders, ...nomineeHeaders, ...bankAccountHeaders];
        xlsHeaders = uniqBy(xlsHeaders, 'header');
        let excelSheet = ExcelUtils.createExcel(null, 'Investor Master', xlsHeaders, xls, null);
        const result = await excelSheet.xlsx.writeBuffer();
        return result;
      } else {
        return new RestError(400, 'Export format not supported', {systemcode: 1008});
      }
    } catch (error) {
      LoggingUtils.error('Some Error Occurred');
      return new RestError(400, 'Error occurred while exporting Investor Master', {systemcode: 1009});
    }
  }

  /**
   * Method to send message to transcation refresher Queue
   * @param id
   * @returns
   */
  async orderItemsRepotingReplicatorByAccountId(id: number): Promise<any> {
    try {
      let message = new TransactionalDataRefreshingQueueMessage();
      message.eventType = TransactionalDataRefreshingQueueMessageEventType.ORDER_ITEM_REPLICATION_BY_ACCOUNT_ID;
      message.accountId = id;
      await QueueProducer.sendMessageInTransactionalDataRefreshingQueue(message).catch(err => {
        throw new Error(err);
      });
      return {success: true};
    } catch (error) {
      LoggingUtils.error('Some Error Occured');
      return error;
    }
  }

  async generateZipForDocuments(AccountIDs: Array<number>, rtaId: number, options: Options): Promise<any> {
    return new Promise(async (resolve, reject) => {
      return this.consolidatedDocumentGenerationEngine
        .generateZipForDocuments(AccountIDs, rtaId, options)
        .then(response => {
          return resolve(response);
        })
        .catch(err => {
          LoggingUtils.error(`Some Error Occured ${JSON.stringify(err)}`);
          return reject(err);
        });
    });
  }

  async investorMasterDetails(filterObject: any, options: Options): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let count: Count;
      let response: Object = {};
      let filter: any = {
        include: [
          {
            relation: 'primaryHolder',
            scope: {
              include: [
                {
                  relation: 'investorDetails',
                  scope: {
                    where: {isActive: true},
                    include: [
                      {relation: 'correspondenceAddress'},
                      {relation: 'countryOfBirth'},
                      {relation: 'stateOfBirth'},
                      {relation: 'occupation'},
                      {relation: 'politicallyExposureType'},
                      {relation: 'wealthSource'},
                      {relation: 'incomeSlab'},
                      {relation: 'taxResidentCountry'}
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
                    where: {},
                    include: [
                      {relation: 'correspondenceAddress'},
                      {relation: 'countryOfBirth'},
                      {relation: 'stateOfBirth'},
                      {relation: 'occupation'},
                      {relation: 'politicallyExposureType'},
                      {relation: 'wealthSource'},
                      {relation: 'incomeSlab'},
                      {relation: 'taxResidentCountry'}
                    ]
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
                    where: {},
                    include: [
                      {relation: 'correspondenceAddress'},
                      {relation: 'countryOfBirth'},
                      {relation: 'stateOfBirth'},
                      {relation: 'occupation'},
                      {relation: 'politicallyExposureType'},
                      {relation: 'wealthSource'},
                      {relation: 'incomeSlab'},
                      {relation: 'taxResidentCountry'}
                    ]
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
                    where: {},
                    include: [
                      {relation: 'correspondenceAddress'},
                      {relation: 'countryOfBirth'},
                      {relation: 'stateOfBirth'},
                      {relation: 'occupation'},
                      {relation: 'politicallyExposureType'},
                      {relation: 'wealthSource'},
                      {relation: 'incomeSlab'},
                      {relation: 'taxResidentCountry'}
                    ]
                  }
                }
              ]
            }
          },
          {
            relation: 'riskProfile'
          },
          {
            relation: 'accountAppFileMapping',
            scope: {
              include: [
                {
                  relation: 'userManagementAppFile'
                }
              ]
            }
          },
          {
            relation: 'bankAccounts',
            scope: {
              where: {
                isActive: true,
                isDefault: true
              },
              include: [
                {
                  relation: 'bankBranch',
                  scope: {
                    include: [{relation: 'bank'}]
                  }
                },
                {
                  relation: 'bankAccountType'
                }
              ]
            }
          },
          {
            relation: 'holdingType'
          },
          {
            relation: 'investorNominees',
            scope: {
              where: {
                isActive: true,
                isMfNominee: true
              },
              include: [
                {
                  relation: 'relationship'
                },
                {
                  relation: 'appUser'
                }
              ]
            }
          }
        ]
      };

      if (filterObject.order) {
        filter.order = [filterObject.order];
      }

      count = await this.accountRepository.count(filter, options);
      return this.accountRepository
        .find({...filter}, options)
        .then(async (result: any[]) => {
          result.forEach(account => {
            if (account.primaryHolder) {
              account.primaryHolderName = account.primaryHolder.name;
            } else {
              account.primaryHolderName = null;
            }
            if (account.secondaryHolder) {
              account.secondaryHolderName = account.secondaryHolder.name;
            } else {
              account.secondaryHolderName = null;
            }
            if (account.tertiaryHolder) {
              account.tertiaryHolderName = account.tertiaryHolder.name;
            } else {
              account.tertiaryHolderName = null;
            }
            if (account.guardian) {
              account.guardianName = account.guardian.name;
            } else {
              account.guardianName = null;
            }
            if (account.primaryHolder && account.primaryHolder.bosCode) {
              account.primaryHolderBosCode = account.primaryHolder.bosCode;
            } else {
              account.primaryHolderBosCode = null;
            }
          });

          let searchCriteria = new Map();
          let valueToSearch: string;
          filterObject.where.find((data: Object) => {
            searchCriteria.set(Object.keys(data)[0], Object.values(data)[0]);
          });

          let updatedArray = result.filter(data => {
            if (searchCriteria.has('primaryHolderName')) {
              if (data.primaryHolderName) {
                valueToSearch = searchCriteria.get('primaryHolderName').toLowerCase();
                if (!data.primaryHolderName.toLowerCase().includes(valueToSearch)) {
                  return false;
                }
              } else return false;
            }
            if (searchCriteria.has('secondaryHolderName')) {
              if (data.secondaryHolderName) {
                valueToSearch = searchCriteria.get('secondaryHolderName').toLowerCase();
                if (!data.secondaryHolderName.toLowerCase().includes(valueToSearch)) {
                  return false;
                }
              } else return false;
            }
            if (searchCriteria.has('tertiaryHolderName')) {
              if (data.tertiaryHolderName) {
                valueToSearch = searchCriteria.get('tertiaryHolderName').toLowerCase();
                if (!data.tertiaryHolderName.toLowerCase().includes(valueToSearch)) {
                  return false;
                }
              } else return false;
            }
            if (searchCriteria.has('guardianName')) {
              if (data.guardianName) {
                valueToSearch = searchCriteria.get('guardianName').toLowerCase();
                if (!data.guardianName.toLowerCase().includes(valueToSearch)) {
                  return false;
                }
              } else return false;
            }
            if (searchCriteria.has('uniqueId')) {
              if (data.uniqueId) {
                valueToSearch = searchCriteria.get('uniqueId').toLowerCase();
                if (!data.uniqueId.toLowerCase().includes(valueToSearch)) {
                  return false;
                }
              } else return false;
            }
            if (searchCriteria.has('primaryHolderBosCode')) {
              if (data.primaryHolderBosCode) {
                valueToSearch = searchCriteria.get('primaryHolderBosCode').toLowerCase();
                if (!data.primaryHolderBosCode.toLowerCase().includes(valueToSearch)) {
                  return false;
                }
              } else return false;
            }
            return true;
          });

          if (filterObject.export) {
            response = {
              data: updatedArray,
              count: updatedArray.length
            };
          } else {
            const data = updatedArray.slice(filterObject.offset, filterObject.limit + filterObject.offset);
            response = {
              data: data,
              count: updatedArray.length
            };
          }

          return resolve(response);
        })
        .catch((error: any) => {
          LoggingUtils.error(error);
          return reject(error);
        });
    });
  }

  // This method is only used for Mfrta check:
  async mfrtaGetBankDetailsById(id: number, options?: Options): Promise<object> {
    type objectType = {
      accountNumber: string;
      accountType: string;
      ifscCode: string;
      holdingPattern: string;
    };
    type accountOpeningObjType = {
      accountType: string;
    };
    type MetaData = {
      accountOpening: Array<accountOpeningObjType>;
      mfRTA: Array<objectType>;
    };
    let metaData: MetaData = {accountOpening: [], mfRTA: []};
    let data: Array<objectType> = [];
    return new Promise((resolve, reject) => {
      this.accountRepository
        .findOne(
          {
            where: {
              id: id,
              isActive: true
            },
            include: [
              'holdingType',
              {
                relation: 'bankAccounts',
                scope: {
                  include: ['bankAccountType', 'bankBranch'],
                  where: {
                    isActive: true
                  }
                }
              }
            ]
          },
          options
        )
        .then((account: Account | null) => {
          if (!account) {
            return Promise.reject(new RestError(404, 'Account not found', {systemcode: 1086}));
          }
          if (account.bankAccounts && account.bankAccounts.length > 0) {
            account.bankAccounts.forEach((bankAccount: BankAccount) => {
              let object: objectType = {
                accountNumber: '',
                accountType: '',
                ifscCode: '',
                holdingPattern: ''
              };
              let accountOpeningObj: accountOpeningObjType = {
                accountType: ''
              };
              object.accountNumber = bankAccount.accountNumber;
              let type = bankAccount.bankAccountType && bankAccount.bankAccountType.name;
              object.accountType = type;
              object.ifscCode = bankAccount.bankBranch && bankAccount.bankBranch.ifscCode;
              object.holdingPattern = account.holdingType && account.holdingType.name;
              data.push(object);
              accountOpeningObj.accountType = type;
              metaData.mfRTA.push(object);
              metaData.accountOpening.push(accountOpeningObj);
            });
          }
          return resolve({data: data, metaData: metaData});
        })
        .catch(reject);
    });
  }

  async markNomineeDetailsAsUpdated(id: number, options: Option) {
    try {
      await this.accountRepository.updateById(id, {isNomineeDetailsUpdated: true}, options);
      return {success: true};
    } catch (error) {
      LoggingUtils.error('Some Error Occured');
      return error;
    }
  }

  async sendInvestorAccountCreationNotification(id: number, options?: Option) {
    try {
      const accdata = await this.accountRepository.findOne(
        {
          where: {
            id: id,
            isActive: true
          },
          include: [
            {
              relation: 'primaryHolder'
            },
            {
              relation: 'bankAccounts',
              scope: {
                where: {
                  isActive: true,
                  isDefault: true
                }
              }
            },
            {
              relation: 'investorNominees',
              scope: {
                where: {
                  isActive: true,
                  isMfNominee: true
                },
                include: [
                  {
                    relation: 'appUser'
                  }
                ]
              }
            }
          ]
        },
        options
      );

      await NotificationUtils.sendNotificationEvent({
        accountId: id,
        topicId: NotificationTopics.TOPICS.investmentAccount.accountOpened.value,
        notificationType: NotificationTopics.TOPICS.investmentAccount.accountOpened.topic,
        templateKeys: {
          customerName: accdata!.name,
          customerId: `XX${accdata!.primaryHolder.userCode.slice(-4)}`,
          wealthappTcUrl: '',
          accountHolderName: accdata!.name,
          nomineeName: accdata!.investorNominees![0].appUser!.name,
          emailId: 'mailto:smartwealth@hdfcbank.com',
          investmentAccountNumber: `XX${accdata!.uniqueId!.slice(-4)}`,
          bankAccountNumber: `XX${accdata!.bankAccounts![0].accountNumber!.slice(-4)}`
        }
      });
    } catch (error) {
      LoggingUtils.error('Some Error Occured');
      return error;
    }
  }
}
