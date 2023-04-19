import {BindingScope, injectable} from '@loopback/core';
import {ANY, Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {CoreBankingRepository, OtpMessages} from '../repositories/core-banking.repository';
import moment from 'moment-timezone';
import _, {isEmpty} from 'underscore';
import {
  CountryRepository,
  OccupationRepository,
  WealthSourceRepository,
  PoliticallyExposureTypeRepository,
  StateRepository,
  AddressRepository,
  OverseesAddressRepository,
  AppUserRepository,
  InvestorDetailsRepository,
  IncomeSlabRepository,
  HoldingTypeRepository,
  InvestorTypeRepository,
  BankAccountTypeRepository,
  Option,
  BankBranchRepository,
  AccountRepository,
  InvestorNomineeRepository,
  LoggingUtils,
  BankAccountRepository,
  InvestorDetails,
  InvestorDetailsRelations,
  IdentificationTypeRepository,
  CommunicationMatrixRepository,
  CommunicationTopicRepository,
  RestError
} from 'common';
import AppConstant from 'common/dist/constants/app-constant';

export type fetchCustomerAccountAmlFatcaDetailsType = {
  success: boolean;
  code: string;
  bankErrorCode?: string | number;
  errorCode?: string | number;
};
@injectable({scope: BindingScope.APPLICATION})
export class CoreBankingFacade {
  constructor(
    @repository(CoreBankingRepository)
    private coreBankingRepository: CoreBankingRepository,
    @repository(CountryRepository)
    private countryRepository: CountryRepository,
    @repository(OccupationRepository) private occupationRepository: OccupationRepository,
    @repository(WealthSourceRepository) private wealthSourceRepository: WealthSourceRepository,
    @repository(PoliticallyExposureTypeRepository) private politicallyExposureTypeRepository: PoliticallyExposureTypeRepository,
    @repository(StateRepository) private stateRepository: StateRepository,
    @repository(AddressRepository) private addressRepository: AddressRepository,
    @repository(OverseesAddressRepository) private overseesAddressRepository: OverseesAddressRepository,
    @repository(AppUserRepository) private appUserRepository: AppUserRepository,
    @repository(InvestorDetailsRepository) private investorDetailsRepository: InvestorDetailsRepository,
    @repository(IncomeSlabRepository) private incomeSlabRepository: IncomeSlabRepository,
    @repository(HoldingTypeRepository) private holdingTypeRepository: HoldingTypeRepository,
    @repository(InvestorTypeRepository) private investorTypeRepository: InvestorTypeRepository,
    @repository(BankAccountTypeRepository) private bankAccountTypeRepository: BankAccountTypeRepository,
    @repository(BankBranchRepository) private bankBranchRepository: BankBranchRepository,
    @repository(AccountRepository) private accountRepository: AccountRepository,
    @repository(InvestorNomineeRepository) private investorNomineeRepository: InvestorNomineeRepository,
    @repository(BankAccountRepository) private bankAccountRepository: BankAccountRepository,
    @repository(IdentificationTypeRepository) private identificationTypeRepository: IdentificationTypeRepository,
    @repository(CommunicationMatrixRepository) private communicationMatrixRepository: CommunicationMatrixRepository,
    @repository(CommunicationTopicRepository) private communicationTopicRepository: CommunicationTopicRepository
  ) {}

  async fetchCustomerAccountAmlFatcaDetails(
    pan: string = '',
    dob: string = '',
    mobileNumber: string = '',
    customerId: string = '',
    transactionId: string,
    userId?: number,
    options?: Options
  ): Promise<fetchCustomerAccountAmlFatcaDetailsType | void> {
    const methodName = 'fetchCustomerAccountAmlFatcaDetails';
    try {
      if (!isEmpty(dob)) {
        dob = dob.replace(/-/g, '');
      }

      LoggingUtils.debug('Step 1 etb sync initialize ', methodName);
      let customerDetails: any = {
        userId: userId,
        pan: pan,
        dob: dob,
        customerID: customerId,
        mobileNumber: mobileNumber
      };
      // customerDetails['mobileNumber'] = mobileNumber;
      // customerDetails['customerID'] = customerId;
      // customerDetails['pan'] = pan;
      // customerDetails['dob'] = dob;
      LoggingUtils.debug('Step 2 validating etb request body ', methodName);
      if (!customerDetails.mobileNumber && !customerDetails.pan && !customerDetails.dob && !customerDetails.customerID) {
        LoggingUtils.debug('Step 3 etb request body validation failed', methodName);
        return {
          success: false,
          code: 'NO_DETAILS_PROVIDED'
        };
      }
      LoggingUtils.debug('Step 4 Invoking fetchCustomerAccountFatcaDetails repo method', methodName);
      // perform error handling. for this
      const responseData: any = await this.coreBankingRepository.fetchCustomerAccountAmlFatcaDetails(
        customerDetails.mobileNumber,
        customerDetails.pan,
        customerDetails.dob,
        customerDetails.customerID,
        transactionId
      );
      const {status} = responseData;
      //adding check for this reply code. Not mentioned in the sheet (DL-97)
      //We are diverting as NTB customer as no data received
      if (status.errorCode == '12301' || status.replyCode == 12301) {
        LoggingUtils.debug(`Step 4-A Path for NTB customer `, methodName);
        return {
          success: false,
          code: 'NO_DATA'
        };
      }

      //Error handling for the ETB SYNC
      if (status.replyCode != 0) {
        LoggingUtils.debug(`Step 4-B etb response `, methodName);
        return {success: false, bankErrorCode: status.replyCode, code: status.replyText};
      }

      LoggingUtils.debug(`Step 5 etb response `, methodName);
      if (
        responseData &&
        responseData.responseString &&
        responseData.responseString.customerDetailsDTO &&
        responseData.responseString.customerDetailsDTO.length > 0
      ) {
        const customerData = responseData.responseString.customerDetailsDTO;
        let investorDetailsArray: any = [];
        if (customerData.length > 1) {
          LoggingUtils.debug('Step 6 flow end multiple customer data', methodName);
          return {
            success: false,
            code: 'MULTIPLE_CUSTOMER_DATA'
          };
        }
        LoggingUtils.debug('Step 7 single customer flow initiated', methodName);
        const element = customerData[0];
        LoggingUtils.debug('Step 8 fetching existing app user ', methodName);
        const checkUniqueUser = await this.appUserRepository.findOne({
          where: {
            bosCode: element?.customerId,
            isActive: true
          }
        });
        LoggingUtils.debug(`Step 8 existing app user response `, methodName);
        if (!checkUniqueUser || checkUniqueUser.id == userId) {
          //if(pan === element?.refCustItNum){ //@todo when update pan will work uncomment it
          LoggingUtils.debug('Step 9 ETB sync started', methodName);
          let userObject: any = {};
          let investorDetailsObj: any = {};
          let addressObj: any = {};
          let permanentAddrObj: any = {};
          let overseasAddrObj: any = {};
          let bankAccountObj: any = {};
          let accountObj: any = {};
          let nomineeObj: any = {};
          let nomineeUser: any = {};
          let custId;
          userObject.name = element?.customerFullName;
          // userObject.contactNumber = mobileNumber.substring(2) || element?.refPhoneMobile.substring(2); // remove 91 and compare
          // userObject.contactNumberCountryCode = element?.refPhoneMobile ? '+' + element?.refPhoneMobile.substring(0, 2) : null
          userObject.email = element?.refCustEmail;
          userObject.bosCode = element?.customerId;

          custId = element.customerId;
          //exiting if no customer id
          if (custId == undefined) {
            LoggingUtils.debug('Step 10 customer id not found', methodName);
            throw new Error('Customer ID not present');
          }
          // userObject.userCode = ''; //@todo should have unique value
          // userObject.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS.singleCustomerID.value; //@todo need to change acc to bank api

          if (element.txtCustSex === 'F') {
            userObject.gender = Option.GLOBALOPTIONS.GENDER.female.value;
            investorDetailsObj.gender = Option.GLOBALOPTIONS.GENDER.female.value;
          }
          if (element.txtCustSex === 'M') {
            userObject.gender = Option.GLOBALOPTIONS.GENDER.male.value;
            investorDetailsObj.gender = Option.GLOBALOPTIONS.GENDER.male.value;
          }
          if (element.txtCustSex === 'T') {
            userObject.gender = Option.GLOBALOPTIONS.GENDER.transgender.value;
            investorDetailsObj.gender = Option.GLOBALOPTIONS.GENDER.transgender.value;
          }
          LoggingUtils.debug(`Step 11 updating appuser data ${userId}`, methodName);
          await this.appUserRepository.updateById(userId, userObject).catch(err => {
            throw new Error('Error occurred while updating user');
          });
          LoggingUtils.debug('Step 12 fetching investor object for etb sync', methodName);
          //Will be using raw sql query

          const investorSqlQuery = `
          SELECT "id" FROM "public"."investor_details" WHERE (("pan_card_number"=$1) OR ("birth_date"= $2)) AND "fk_id_user"=$3 AND "is_active"=$4 ORDER BY "id" LIMIT 1
          ` ;

          const investorSqlQueryResult = await this.investorDetailsRepository.execute(
            investorSqlQuery,
            [
              pan || element?.refCustItNum,
              (dob && moment(dob).format('YYYY-MM-DD')) || (element?.datBirthCust && moment(element.datBirthCust).format('YYYY-MM-DD')),
              userId,
              true
            ],
            options
          );
          // const checkUniquePan: (InvestorDetails & InvestorDetailsRelations) | null = await this.investorDetailsRepository.findOne({
          //   where: {
          //     or: [
          //       {panCardNumber: pan || element?.refCustItNum},
          //       {
          //         birthDate:
          //         (dob && moment(dob).format('YYYY-MM-DD')) || (element?.datBirthCust && moment(element.datBirthCust).format('YYYY-MM-DD')),
          //         appUserId: userId
          //       }
          //       // {appUserId: userId}
          //     ],
          //     appUserId: userId,
          //     isActive: true
          //   }
          // });
          LoggingUtils.debug(`Step 13 investor detail response `, methodName);
          if (!isEmpty(investorSqlQueryResult) && investorSqlQueryResult.length == 1) {
            const checkUniquePan = investorSqlQueryResult[0];
            LoggingUtils.debug('Step 14 syncing investor object', methodName);
            investorDetailsObj.birthDate =
              (dob && moment(dob).format('YYYY-MM-DD')) || (element?.datBirthCust && moment(element.datBirthCust).format('YYYY-MM-DD'));
            investorDetailsObj.panCardNumber = pan || element?.refCustItNum;
            // investorDetailsObj.appUserId = userId;
            LoggingUtils.debug('Step 15 syncing address details', methodName);
            const otherState = await this.stateRepository.findOne(
              {
                where: {
                  name: 'Others',
                  bseCode: 'XX',
                  isActive: true
                }
              },
              options
            );
            if (element.txtCustadrAdd1) {
              addressObj.addressLine1 = element.txtCustadrAdd1;
              addressObj.addressLine2 = element.txtCustadrAdd2;
              addressObj.addressLine3 = element.txtCustadrAdd3;
              addressObj.landmark = element.txtCustadrAdd3;
              addressObj.city = element.namCustadrCity;
              addressObj.pincode = element.txtCustadrZip;
              // Removing default value
              //addressObj.addressTypeId = 2; //@todo change address type (now residential) from api (when info available)

              overseasAddrObj.addressLine1 = element.txtCustadrAdd1;
              overseasAddrObj.addressLine2 = element.txtCustadrAdd2;
              overseasAddrObj.addressLine3 = element.txtCustadrAdd3;
              overseasAddrObj.landmark = element.txtCustadrAdd3;
              overseasAddrObj.city = element.namCustadrCity;
              overseasAddrObj.pincode = element.txtCustadrZip;
              // Removing default value
              //overseasAddrObj.addressTypeId = 2; //@todo change address type (now residential) from api (when info available)

              const state = this.convertToCamelCase(element.namCustadrState);
              const stateData = await this.stateRepository.findOne(
                {
                  where: {
                    name: state,
                    isActive: true
                  }
                },
                options
              );
              const overseeCountryCode = element.namCustadrCntry ?? element.namCustadrCntryDescription;
              const overseeCountry = await this.getCountryData(overseeCountryCode, options);
              addressObj.stateId = (stateData && stateData.id) || (otherState && otherState.id) || 36; // set other if state not match
              overseasAddrObj.state = element.namCustadrState;
              overseasAddrObj.countryId = overseeCountry && overseeCountry.id;
              LoggingUtils.debug('Step 16 creating correspondence address ', methodName);
              const corressAddr = await this.addressRepository.create(addressObj);
              LoggingUtils.debug('Step 17 creating overseaAddress', methodName);
              const overseasAddr = await this.overseesAddressRepository.create(overseasAddrObj);
              investorDetailsObj.correspondenceAddressId = corressAddr && corressAddr.id;
              investorDetailsObj.overseesAddressId = overseasAddr && overseasAddr.id;
            }
            let permanentAddr;
            if (element.txtPermadrAdd1) {
              permanentAddrObj.addressLine1 = element.txtPermadrAdd1;
              permanentAddrObj.addressLine2 = element.txtPermadrAdd2;
              permanentAddrObj.addressLine3 = element.txtPermadrAdd3 ? element.txtPermadrAdd3 : null;
              permanentAddrObj.landmark = element.txtPermadrAdd3;
              permanentAddrObj.city = element.namPermadrCity;
              permanentAddrObj.state = element.namPermadrState;
              permanentAddrObj.pincode = element.txtPermadrZip;
              // Removing default value
              //permanentAddrObj.addressTypeId = 2; //@todo change address type (now residential) from api (when info available)

              const permanentstate = this.convertToCamelCase(element.namPermadrState);
              const permanentStateData = await this.stateRepository.findOne(
                {
                  where: {
                    name: permanentstate,
                    isActive: true
                  }
                },
                options
              );
              permanentAddrObj.stateId = (permanentStateData && permanentStateData.id) || (otherState && otherState.id) || 36; // set other if state not match;
              LoggingUtils.debug('Step 18 creating permanent address', methodName);
              permanentAddr = await this.addressRepository.create(permanentAddrObj);
              investorDetailsObj.permanentAddressId = permanentAddr && permanentAddr.id;
            }

            //fix for marital status
            //---------
            const maritialStatus = await this.fetchMaritalStatus(element.codCustMarstat);
            if (maritialStatus) {
              investorDetailsObj.maritalStatus = maritialStatus;
            }
            //---------
            //We're picking the 1stb occurence for bank account to create account
            LoggingUtils.debug('Step 19 Syncing account and Bank account details', methodName);
            const customerAccountDetails = _.find(element.customerAccountDetailsDTO, function (item) {
              return item.customerId === element.customerId;
            });
            LoggingUtils.debug(`Step 20 fetching customer account details `, methodName);
            // Empty check from Account details from etb
            if (customerAccountDetails == undefined) {
              LoggingUtils.debug('Step 20-b customerAccountDetails not found', methodName);
              throw new Error('Customer ID not present');
            }
            // finding app user based on fetch etb details based on bos code --- need fix this section. getting wrong data change with customer id
            // resolved
            const holderData = await this.appUserRepository.findOne({
              where: {
                bosCode: custId,
                isActive: true
              }
            });
            LoggingUtils.debug(`Step 21 fetching holder data  `, methodName);
            if (AppConstant.ALLOWED_BANK_ACCOUNT_TYPES.includes(customerAccountDetails?.codAcctCustRel)) {
              //we're only setting bos code for sow ?
              LoggingUtils.debug('Step 22 Setting Holding Data for SOW, JOF and JOO', methodName);
              accountObj.primaryHolderId = holderData && holderData.id;
              accountObj.bosCode = custId;
              const holdingType = await this.getHoldingType(customerAccountDetails?.codAcctCustRel, options);
              const activeAccountStatus = Option.GLOBALOPTIONS.BANKACCOUNTSTATUS.active.bankCode;
              if (activeAccountStatus.includes(customerAccountDetails?.accountStatus)) {
                accountObj.holdingTypeId = holdingType && holdingType.id;
              }
            }
            // if (customerAccountDetails?.codAcctCustRel === 'JOF') {
            //   LoggingUtils.debug('Step 23 JOF', methodName);
            //   accountObj.primaryHolderId = holderData && holderData.id;
            //   accountObj.bosCode = custId;
            // }
            // if (customerAccountDetails?.codAcctCustRel === 'JOO') {
            //   //we're not setting primary account holder ? need to verify with pranav
            //   // tag with primaryAccountholder
            //   // resolved
            //   LoggingUtils.debug('Step 24 JOO', methodName);
            //   accountObj.primaryHolderId = holderData && holderData.id;
            //   accountObj.bosCode = custId;
            // }
            // if (customerAccountDetails?.codAcctCustRel === 'GUR') {
            //   //@todo this will be as a guardian user
            // }
            accountObj.name = element.customerFullName;
            LoggingUtils.debug('Step 25 checking for existing account', methodName);
            //need to check that bos code should not be undefined change with customer id
            //resolved
            let isAccountExist = await this.accountRepository.findOne({
              where: {
                bosCode: custId,
                isActive: true
              }
            });
            LoggingUtils.debug(`Step 26 existing account deatils  `, methodName);
            // need to understand logic behind this account ?
            if (!isAccountExist) {
              accountObj.accountStatus = Option.GLOBALOPTIONS.ACCOUNTSTATUS.pendingRegistration.value;
              accountObj.accountOpeningDate = moment().toDate();
              accountObj.bosCode = custId;
              accountObj.primaryHolderId = holderData && holderData.id;
              LoggingUtils.debug('Step 27 creating new Account', methodName);
              const isAccountExist = await this.accountRepository.create(accountObj);
              LoggingUtils.debug(`Step 28 created Account `, methodName);
              const accountId = isAccountExist && isAccountExist.id;
              await this.addCommunicationMatrix(accountId, options);
              const uniqueId = this.generateAccountUniqueId(accountId);
              await this.accountRepository.updateById(accountId, {uniqueId: uniqueId});
            } else {
              LoggingUtils.debug('Step 29 updating existing account', methodName);
              await this.accountRepository.updateAll(accountObj, {id: isAccountExist.id});
            }
            LoggingUtils.debug('Step 30 fetching updated account data ', methodName);
            // need to revisit getting wrong data when finding --->>>> since we're setting bos code for sow why we're searching with bos code ? pass customer id
            //resolved
            let accountDatas = await this.accountRepository.find({
              where: {or: [{bosCode: custId}, {primaryHolderId: userId}], isActive: true}
            });
            if (accountDatas.length > 1) {
              throw 'User can not have Multiple account';
            }
            let accountData = accountDatas[0];
            bankAccountObj.accountId = accountData!.id;
            LoggingUtils.debug(`Step 31 setting fk_id_account for bank account record `, methodName);

            const investorTypes = await this.investorTypeRepository.find(
              {
                where: {
                  isActive: true
                }
              },
              options
            );
            LoggingUtils.debug('Step 32 Fetching investor type', methodName);
            //Finding investor type & setting its id to investorTypeId
            // need to verify this function.----------------------------------------------
            let investorTypeData = _.find(investorTypes, function (item) {
              const coreBankCodes = item.coreBankCode;
              if (coreBankCodes?.includes(element?.flgCustTyp.trim())) {
                return item;
              }
            });
            //-----------------------------------------------------------------------------
            LoggingUtils.debug(`Step 33 investor type data `, methodName);
            if (investorTypeData) {
              LoggingUtils.debug('Step 34 setting investor type key', methodName);
              investorDetailsObj.investorTypeId = investorTypeData.id;
            }
            LoggingUtils.debug('Step 35 Sync bank and nominee data', methodName);

            //creating bank account & nomineee
            const customerAccountDetailsDTO: any = element.customerAccountDetailsDTO;
            // never enter in this code...... need to check
            if (customerAccountDetailsDTO && Array.isArray(customerAccountDetailsDTO)) {
              const checkDefaultBankAccount = customerAccountDetailsDTO.length > 1 ? false : true;
              LoggingUtils.debug(`Step 36 default bank account check `, methodName);
              for (const data of customerAccountDetailsDTO) {
                LoggingUtils.debug('Step 37 bank account loop ', methodName);
                if (AppConstant.ALLOWED_BANK_ACCOUNT_TYPES.includes(data.codAcctCustRel)) {
                  let bankAccountData: any;
                  LoggingUtils.debug('Step 38 only sync saving bank account', methodName);
                  if (data.prodTypeDesc === 'SAVING') {
                    LoggingUtils.debug('Saving account ', methodName);
                    //@todo for now storing only saving accounts
                    const statusObj = Option.GLOBALOPTIONS.BANKACCOUNTSTATUS;
                    Object.entries(statusObj).forEach((value: any) => {
                      let [key, values] = value;
                      const bankCodes = values.bankCode;
                      if (bankCodes.includes(data.accountStatus)) {
                        bankAccountObj.bankAccountStatus = values.value;
                      }
                    });
                    // we re not creating blocked bank account
                    LoggingUtils.debug(`Bankaccount object `, methodName);
                    if (bankAccountObj.bankAccountStatus !== 2) {
                      let investorDetailsNomineeObj: any = {};
                      LoggingUtils.debug('Finding bank account ', methodName);
                      // Removing unique account no check as we can tag multiple bank accounts to one account
                      // const checkUniqueAccountNo = await this.bankAccountRepository.findOne({
                      //   where: {
                      //     accountNumber: data?.accountNumber,
                      //     isActive: true
                      //   }
                      // });
                      // if (!checkUniqueAccountNo) {
                      bankAccountObj.isDefault = checkDefaultBankAccount;
                      bankAccountObj.accountNumber = data.accountNumber;
                      bankAccountObj.accountName = data.accountTitle;
                      LoggingUtils.debug('get holding type ', methodName);
                      const holdingTypeData = await this.getHoldingType(data?.codAcctCustRel, options);
                      bankAccountObj.holdingTypeId = holdingTypeData && holdingTypeData.id;

                      if (investorTypeData) {
                        LoggingUtils.debug('investor type key ', methodName);
                        bankAccountObj.investorTypeId = investorTypeData.id;
                      }
                      let bankAccountType: string;
                      if (data.productTypeDescription && ['NRE', 'NRO'].includes(data.productTypeDescription.toUpperCase())) {
                        bankAccountType = `${data.productTypeDescription}-${data.prodTypeDesc}`.toUpperCase();
                      } else {
                        bankAccountType = `${data.prodTypeDesc}-${data.productTypeDescription}`.toUpperCase();
                      }
                      LoggingUtils.debug('finding bank account type repo', methodName);
                      const bankAccountTypeData = await this.bankAccountTypeRepository.findOne(
                        {
                          where: {
                            bosCode: bankAccountType,
                            isActive: true
                          }
                        },
                        options
                      );
                      bankAccountObj.bankAccountTypeId = bankAccountTypeData && bankAccountTypeData.id;
                      LoggingUtils.debug('fetching bank branch details ', methodName);
                      const bankBranchData = await this.bankBranchRepository.findOne(
                        {
                          where: {
                            ifscCode: data.ifscCode,
                            isActive: true
                          }
                        },
                        options
                      );
                      bankAccountObj.bankBranchId = bankBranchData && bankBranchData.id;
                      LoggingUtils.debug('creating bank account', methodName);
                      //finally creating banch
                      bankAccountData = await this.bankAccountRepository.create(bankAccountObj);
                      //setting investor type for nri
                      if (element?.flgCustTyp.trim() == 'O') {
                        if (checkDefaultBankAccount) {
                          if (bankAccountType == 'NRE-SAVING') {
                            //Finding NRE investor type & setting its id to investorTypeId
                            let NREinvestorTypeData = _.find(investorTypes, function (item) {
                              if (item.bseCode == '21') {
                                return item;
                              }
                            });
                            LoggingUtils.debug(`Step-- NRE investor type data `, methodName);
                            if (NREinvestorTypeData) {
                              LoggingUtils.debug('Step-- NRE setting investor type key', methodName);
                              investorDetailsObj.investorTypeId = NREinvestorTypeData.id;
                            }
                          }
                          if (bankAccountType == 'NRO-SAVING') {
                            //Finding NRO investor type & setting its id to investorTypeId
                            let NROinvestorTypeData = _.find(investorTypes, function (item) {
                              if (item.bseCode == '24') {
                                return item;
                              }
                            });
                            LoggingUtils.debug(`Step-- NRO investor type data `, methodName);
                            if (NROinvestorTypeData) {
                              LoggingUtils.debug('Step-- NRO setting investor type key', methodName);
                              investorDetailsObj.investorTypeId = NROinvestorTypeData.id;
                            }
                          }
                        }
                      }
                      LoggingUtils.debug(`bank account repo obj  `, methodName);
                    }
                  }
                }
                LoggingUtils.debug('Step - Skipping bank account sync as only saving (SOW, JOF or JOO) bank accounts ', methodName);
                continue;
              }
              LoggingUtils.debug('Step 39 bank account and nominee sync done ', methodName);
            }
            LoggingUtils.debug('Step 40 fetching occupation details', methodName);
            const occupations = await this.occupationRepository.find(
              {
                where: {
                  isActive: true
                }
              },
              options
            );

            const incomeSources = await this.wealthSourceRepository.find(
              {
                where: {
                  isActive: true
                }
              },
              options
            );

            const grossIncomes = await this.incomeSlabRepository.find(
              {
                where: {
                  isActive: true
                }
              },
              options
            );
            const customerAMLDetailsDTO: any = element.customerAMLDetailsDTO;
            if (customerAMLDetailsDTO && Array.isArray(customerAMLDetailsDTO)) {
              LoggingUtils.debug('Step 41 sync occupation', methodName);
              for (const data of customerAMLDetailsDTO) {
                let occupationData = _.find(occupations, function (item) {
                  const coreBankCodes = item.coreBankCode?.map(element => element?.toLowerCase());
                  if (coreBankCodes?.includes(data.txtOccupDesc?.toLowerCase().trim())) {
                    return item;
                  }
                });
                investorDetailsObj.occupationId = occupationData && occupationData.id;
                let incomeSourceData = _.find(incomeSources, function (item) {
                  const coreBankCodes = item.coreBankCode?.map(element => element?.toLowerCase());
                  if (coreBankCodes?.includes(data.incSrcDesc?.toLowerCase().trim())) {
                    return item;
                  }
                });
                investorDetailsObj.wealthSourceId = incomeSourceData && incomeSourceData.id;
                //Need to verify this piece of code ------------------------------------------------------
                let grossIncomeData = _.find(grossIncomes, function (item) {
                  const coreBankCodes = item.coreBankCode;
                  if (coreBankCodes?.includes(data.grossIncDesc.trim())) {
                    return item;
                  }
                });
                investorDetailsObj.incomeSlabId = grossIncomeData && grossIncomeData.id;
                //-----------------------------------------------------------------------------------------
                LoggingUtils.debug('Step 42 checking for politically exposure', methodName);
                const politicalExposureData = await this.politicallyExposureTypeRepository.findOne(
                  {
                    where: {
                      bosCode: data.amlCod1,
                      isActive: true
                    }
                  },
                  options
                );

                investorDetailsObj.employerName = data.txtEmployerDesc;
                investorDetailsObj.employerCategory = data.typEmployer;
                investorDetailsObj.politicallyExposureTypeId = politicalExposureData && politicalExposureData.id;
              }
            }

            const customerFATCADtlsDTOData: any = element.customerFATCADtlsDTO;
            if (customerFATCADtlsDTOData && Array.isArray(customerFATCADtlsDTOData)) {
              LoggingUtils.debug('Step 43 sync personal details ', methodName);
              for (const data of customerFATCADtlsDTOData) {
                investorDetailsObj.birthCity = data?.namCityBirth;
                investorDetailsObj.fatherName = data?.namCustFather;
                investorDetailsObj.spouseName = data?.namCustSpouse;
                const countryData = await this.getCountryData(data?.codTaxCntry1, options);
                const birthCountry = await this.getCountryData(data?.codCntryBirth, options);

                investorDetailsObj.countryOfBirthId = birthCountry && birthCountry.id;
                investorDetailsObj.taxResidentCountryId = countryData && countryData.id;
              }
            }
            investorDetailsObj.motherName = element.namMotherMaiden;
            // creating nominee investor details
            if (investorDetailsArray.length > 0) {
              const nomineeInvestor = await this.investorDetailsRepository.createAll(investorDetailsArray);
              LoggingUtils.debug(`Step 44 creating records for investor nominee  `, methodName);
            }
            LoggingUtils.debug(`Step 45 updating app user investor object `, methodName);
            //Keeping fk_identification_type = 3(for PAN BSE_CODE = C)
            const identificationTypes = await this.identificationTypeRepository.findOne(
              {
                where: {
                  bseCode: 'C',
                  isActive: true
                }
              },
              options
            );

            if (identificationTypes) {
              investorDetailsObj.identificationTypeId = identificationTypes.id;
            }
            await this.investorDetailsRepository.updateById(checkUniquePan!.id, investorDetailsObj).catch(err => {
              throw new Error('Error occurred when updating Investor details');
            });
            await this.appUserRepository.updateById(userId, {appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS.singleCustomerID.value});
          }
          LoggingUtils.debug('Step 46 ETB SYNC DONE', methodName);
          return {success: true, code: 'SUCCESS'};
        } else {
          LoggingUtils.debug(`Step 47 User already exists with this customerId -  ${element?.customerId}`, methodName);
          return {success: false, code: 'USER_EXIST'};
        }
      } else {
        LoggingUtils.debug('Step 48 No data to process', methodName);
        return {
          success: false,
          code: 'NO_DATA'
        };
      }
    } catch (err: any) {
      LoggingUtils.error(err.message, methodName);
      return {success: false, errorCode: 'ETB_SYNC_FAILED', code: err.message}; //@todo need to finalized error code
    }
  }

  convertToCamelCase(value: string) {
    let newArray: any = [];
    const splitedValue = value.split(' ');
    _.each(splitedValue, function (item) {
      if (item !== ('and' || 'AND' || '&')) {
        let convertedValue = item.charAt(0).toUpperCase() + item.slice(1).toLowerCase();
        newArray.push(convertedValue);
      } else {
        newArray.push(item);
      }
    });
    newArray = newArray.join(' ');
    return newArray;
  }

  generateAccountUniqueId(id: number | undefined): string {
    const seriesStarts = 10000000;
    return seriesStarts + id! + '';
  }

  async getHoldingType(holdingPattern: string, options?: Options) {
    const holdingTypes = await this.holdingTypeRepository.find(
      {
        where: {
          isActive: true
        }
      },
      options
    );
    return _.find(holdingTypes, function (item) {
      const coreBankCodes = item.coreBankCode;
      if (coreBankCodes?.includes(holdingPattern)) {
        return item;
      }
    });
  }

  async getCountryData(countryValue: string | null, options?: Options) {
    return await this.countryRepository.findOne(
      {
        where: {
          bseCodeForNationality: countryValue,
          isActive: true
        }
      },
      options
    );
  }

  async getOTP(transactionId: string, linkData: string, refNo: string | null = null) {
    try {
      const otpResponse: any = await this.coreBankingRepository.doGenerateOTP(transactionId, linkData, refNo);
      if (otpResponse && otpResponse.responseString) {
        return otpResponse.responseString;
      }
    } catch (err: any) {
      LoggingUtils.error(err);
      throw err;
    }
  }

  async verifyOTP(otp: string, refNo: string, transactionId: string, linkData: string) {
    try {
      const response: any = await this.coreBankingRepository.doVerifyOTP(otp, refNo, transactionId, linkData);
      if (response && response.responseString) {
        return response.responseString;
      }
    } catch (err: any) {
      LoggingUtils.error(err);
      throw err;
    }
  }

  async doPublishOTP(contactNumber: string, otp: OtpMessages, transactionId: string, msgType = 'S') {
    try {
      const response: any = await this.coreBankingRepository.doPublishOTP(contactNumber, otp, transactionId, msgType);
      if (response && response.divisionCode && response.errorMsg == null) {
        return response.divisionCode;
      }
    } catch (err: any) {
      LoggingUtils.error(err);
      throw err;
    }
  }

  async addCommunicationMatrix(accountId: number | undefined, options?: Options) {
    try {
      if (accountId == undefined) throw 'USER ACCOUNT ID IS IN VALID';
      const communicationTopic = await this.communicationTopicRepository.find({where: {isActive: true}}, options);
      const communicationTopicMap = communicationTopic.map(data => {
        return {
          accountId: accountId,
          communicationTopicId: data.id,
          modeEmail: data.modeEmail,
          modeSms: data.modeSms,
          modePush: data.modePush,
          toggleNotification: data.toggleNotification
        };
      });
      await this.communicationMatrixRepository.createAll(communicationTopicMap);
      return;
    } catch (error) {
      LoggingUtils.error(error);
      throw error;
    }
  }

  async fetchMaritalStatus(bankCode: string | number | any) {
    const options = [];
    const maritalStatus = Option.GLOBALOPTIONS.MARITALSTATUS;
    for (let i of Object.keys(maritalStatus)) {
      options.push(maritalStatus[i]);
    }
    const filter = options.filter(ele => ele.bankCode == bankCode)[0];
    if (filter) {
      return filter.value;
    } else {
      return null;
    }
  }
}
