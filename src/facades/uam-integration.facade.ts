import {injectable, BindingScope, inject} from '@loopback/core';
import {AnyObject, Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {Response} from '@loopback/rest';
import {
  UamIntegrationRepository,
  Option,
  ValidationUtils,
  AppRoleRepository,
  AppUser,
  AppUserRepository,
  UAMLog,
  UAMLogRepository,
  AppUserRoleMapping,
  AppUserRoleMappingRepository,
  RestError,
  OperationRepository,
  UamIntegration,
  UamIntegrationRelations,
  ExcelUtils,
  LoggingUtils,
  Operation,
  UamLoginAttemptsConfig,
  UamLoginAttemptsConfigRepository,
  AppAccessTokenRepository,
  RoleRightsRepository,
  RoleRights
} from 'common';
import _, {where} from 'underscore';
import moment from 'moment-timezone';
const genders = [1, 2, 3];
const categories = [1, 2, 3];
const salutations = [1, 2, 3];
const bcrypt = require('bcryptjs');
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);
import convert from 'xml-js';
import fs from 'fs';
const MAX_DATA_FETCH_LIMIT = 30;
const MIN_SEARCH_CHAR_LIMIT = 3;

type saveNonRMUserDetailsFields = {
  name: string;
  email: string;
  dob: string | null;
  profile: string;
  userCode: string;
  activity: string;
  category: number;
  gender: number;
  salutation: number | undefined;
  contactNumber: string | undefined;
  userType: number;
  appUserStatus: string;
};

type UamIntegrationLogsFields = {
  userCode: string;
  status: string;
  activity: string;
  lastModifiedCheckerId: string | null;
  lastModifiedMakerId: string;
  disableDateTime?: Date;
};

type DepartmentAndProfile = {
  department : string;
  profile : string;
}

// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class UamIntegrationFacade {
  constructor(
    @repository(UamIntegrationRepository) private uamIntegrationRepository: UamIntegrationRepository,
    @repository(AppRoleRepository) private appRoleRepository: AppRoleRepository,
    @repository(AppUserRepository) private appUserRepository: AppUserRepository,
    @repository(UAMLogRepository) private uamLogRepository: UAMLogRepository,
    @repository(AppUserRoleMappingRepository) private appUserRoleMappingRepository: AppUserRoleMappingRepository,
    @repository(OperationRepository) private operationRepository: OperationRepository,
    @repository(UamLoginAttemptsConfigRepository) private uamLoginAttemptsConfigRepository: UamLoginAttemptsConfigRepository,
    @repository(AppAccessTokenRepository) private appAccessTokenRepository: AppAccessTokenRepository,
    @repository(RoleRightsRepository) private roleRightsRepository: RoleRightsRepository
  ) {}

  async create(entity: DataObject<UamIntegration>, options?: Options): Promise<UamIntegration> {
    //we want to update the maker and checker date time every time someone makes a change

    const currentDateTime = new Date();
    entity.lastModifiedMakerDateTime = currentDateTime;
    entity.lastModifiedCheckerDateTime = null;
    entity.lastModifiedCheckerId = null;
    return this.uamIntegrationRepository.create(entity, options);
  }

  async createAll(entities: DataObject<UamIntegration>[], options?: Options): Promise<UamIntegration[]> {
    return this.uamIntegrationRepository.createAll(entities, options);
  }

  async save(entity: UamIntegration, options?: Options): Promise<UamIntegration> {
    return this.uamIntegrationRepository.save(entity, options);
  }

  async find(filter?: any, options?: Options): Promise<(UamIntegration & UamIntegrationRelations)[]> {

    if(filter &&
      filter.where &&
      filter.where.and &&
      filter.where.and.length >0){

        const andArray = filter.where.and
        for(let i = 0; i < andArray.length ; i++){
          if(andArray[i].hasOwnProperty("createdDate") && andArray[i].createdDate.lte){
            let lteDate = new Date(andArray[i].createdDate.lte);
            lteDate.setDate(lteDate.getDate() + 1);
            lteDate.setHours(lteDate.getHours() - 5)
            lteDate.setMinutes(lteDate.getMinutes() - 30)
            andArray[i].createdDate.lte = lteDate
          }
          if(andArray[i].hasOwnProperty("createdDate") && andArray[i].createdDate.gte){

            let gteDate = new Date(andArray[i].createdDate.gte);
            gteDate.setHours(gteDate.getHours() - 5)
            gteDate.setMinutes(gteDate.getMinutes() - 30)

            andArray[i].createdDate.gte = gteDate
          }
        }

        filter.where.and = andArray
      }
    return this.uamIntegrationRepository.find(filter, options);
  }

  async findOne(filter?: Filter<UamIntegration>, options?: Options): Promise<(UamIntegration & UamIntegrationRelations) | null> {
    return this.uamIntegrationRepository.findOne(filter, options);
  }

  async findById(
    id: number,
    filter?: FilterExcludingWhere<UamIntegration>,
    options?: Options
  ): Promise<UamIntegration & UamIntegrationRelations> {
    return this.uamIntegrationRepository.findById(id, filter, options);
  }

  async update(entity: UamIntegration, options?: Options): Promise<void> {
    return this.uamIntegrationRepository.update(entity, options);
  }

  async delete(entity: UamIntegration, options?: Options): Promise<void> {
    return this.uamIntegrationRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<UamIntegration>, where?: Where<UamIntegration>, options?: Options): Promise<Count> {
    return this.uamIntegrationRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<UamIntegration>, options?: Options): Promise<void> {
    return this.uamIntegrationRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<UamIntegration>, options?: Options): Promise<void> {
    return this.uamIntegrationRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<UamIntegration>, options?: Options): Promise<Count> {
    return this.uamIntegrationRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.uamIntegrationRepository.deleteById(id, options);
  }

  async count(where?: any, options?: Options): Promise<Count> {
    if(
      where &&
      where.and &&
      where.and.length >0){

        const andArray = where.and
        for(let i = 0; i < andArray.length ; i++){
          if(andArray[i].hasOwnProperty("createdDate") && andArray[i].createdDate.lte){
            let lteDate = new Date(andArray[i].createdDate.lte);
            lteDate.setDate(lteDate.getDate() + 1);
            lteDate.setHours(lteDate.getHours() - 5)
            lteDate.setMinutes(lteDate.getMinutes() - 30)
            andArray[i].createdDate.lte = lteDate
          }
          if(andArray[i].hasOwnProperty("createdDate") && andArray[i].createdDate.gte){

            let gteDate = new Date(andArray[i].createdDate.gte);
            gteDate.setHours(gteDate.getHours() - 5)
            gteDate.setMinutes(gteDate.getMinutes() - 30)

            andArray[i].createdDate.gte = gteDate
          }
        }

        where.and = andArray
      }
    return this.uamIntegrationRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.uamIntegrationRepository.exists(id, options);
  }

  async isValidRequest(type: string, xmlToJsonObj: any) {
    if (xmlToJsonObj && xmlToJsonObj['s:Envelope'] && xmlToJsonObj['s:Envelope']['s:Body']) {
      if (!xmlToJsonObj['s:Envelope']['s:Body'][type]) {
        return false;
      }
    } else {
      return false;
    }
    return true;
  }

  async createUamLog(body: any) {
    try {
      if (body.uniqueNumber) {
        await this.uamLogRepository.create({
          uniqueNumber: body.uniqueNumber,
          responseObject: JSON.stringify(body)
        });
      }
      return Promise.resolve();
    } catch (err) {
      return Promise.resolve(err);
    }
  }

  async xmlResponse(body: any, previous = false) {
    try {
      if (typeof body == 'string') body = JSON.parse(body);
      const jsonBody = {Response: body};
      const stringifiedBody = JSON.stringify(jsonBody);
      const response = convert.json2xml(stringifiedBody, {compact: true, ignoreComment: true, spaces: 4});
      if (!previous && body.uniqueNumber) {
        await this.uamLogRepository.create({
          uniqueNumber: body.uniqueNumber,
          responseObject: JSON.stringify(body)
        });
      }
      return Promise.resolve(response);
    } catch (err) {
      return Promise.resolve(err);
    }
  }

  parameterize(column: any) {
    let i;
    let frags = column.split('_');
    for (i = 1; i < frags.length; i++) {
      frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    return frags.join('');
  }

  async parseSoapToJSONParam(index: any, xmlToJsonObj: any) {
    let response: any = {};
    _.each(xmlToJsonObj['s:envelope']['s:body'][0][index][0].in[0], (item, param) => {
      response[this.parameterize(param)] = item[0]._ ? item[0]._.trim() : item[0]._;
    });
    return response;
  }

  async isDuplicateRequest(uniqueNumber: string): Promise<any> {
    return await this.uamLogRepository.findOne({
      where: {uniqueNumber: uniqueNumber}
    });
  }

  //   async fetchMakerCheckerDetails() {
  //     return new Promise((resolve, reject) => {
  //       this.appUserRepository
  //         .find({
  //           where: {
  //             userCode: {
  //               inq: ['ISACMAK', 'ISACCHK']
  //             }
  //           }
  //         })
  //         .then(isacUsers => {
  //           if (!isacUsers) {
  //             //DEFAULT MAKER/CHECKER USERS NOT FOUND
  //             return Promise.resolve();
  //           }
  //           const maker = _.find(isacUsers, function (createdAdmin) {
  //             return createdAdmin.userCode == 'ISACMAK';
  //           });
  //           const checker = _.find(isacUsers, function (createdAdmin) {
  //             return createdAdmin.userCode == 'ISACCHK';
  //           });

  //           return Promise.resolve({maker, checker});
  //         })
  //         .then(resolve)
  //         .catch(reject);
  //     });
  //   }

  async saveNonRMUserDetails(req: any, details: saveNonRMUserDetailsFields, appRoleId: number) {
    try {
      if (!details) {
        return Promise.reject(new RestError(400, `Details is required!`, {systemcode: 1329}));
      }

      if (!details.name) {
        return Promise.reject(new RestError(400, `Name is required!`, {systemcode: 1330}));
      }

      if (!details.userCode) {
        return Promise.reject(new RestError(400, `Invalid Employee Code!`, {systemcode: 1331}));
      }

      if (details.dob && !new Date(details.dob)) {
        return Promise.reject(new RestError(400, `Invalid Date of Birth!`, {systemcode: 1332}));
      }
      let userDetails: AppUser;
      const isUserExist: any = await this.appUserRepository.findOne({
        where: {
          // name: details.name,
          // email: details.email,
          // // contactNumber: `INTERNAL - ${details.contactNumber}`, //We don't need to store the contact details in user table as the user is internal
          // gender: details.gender,
          userCode: details.userCode.toUpperCase(),
          isActive: true
        }
      });
      if (isUserExist) {
        return Promise.reject(new RestError(400, 'User already Exists!', {systemcode: 1333}));
      }
      const hashPassword = bcrypt.hashSync('demo', salt);
      let userObj: Partial<AppUser> = {
        appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['pendingRegistration'].value,
        name: details.name,
        email: details.email,
        // contactNumber: details.contactNumber,
        gender: details.gender,
        salutation: details.salutation ? details.salutation : undefined,
        password: hashPassword,
        userCode: details.userCode.toUpperCase()
      };

      const createdUser = await this.appUserRepository.create(userObj);

      if (!createdUser) {
        throw new Error('Error while creating new user');
      }
      LoggingUtils.info(
        {
          userCode: createdUser.userCode,
          appUserStatus: createdUser.appUserStatus,
          lastLoginDate: createdUser.lastLoginDate
        },
        'User Created'
      );
      userDetails = createdUser;
      const operationDetails = await this.operationRepository.create({
        appUserId: createdUser.id,
        employeeCode: details.userCode.toUpperCase(),
        birthDate: details.dob && details.dob != '' ? new Date(details.dob) : undefined,
        category: details.category,
        // maxAllowedLoginAttempts: details.maxAllowedLoginAttempts,
        userType: 2
      });
      if (!operationDetails) {
        throw new Error('Error while creating operation details');
      }
      const appUserRoleMapping = await this.appUserRoleMappingRepository.create({
        appRoleId: appRoleId,
        appUserId: createdUser.id
      });
      if (!appUserRoleMapping) {
        throw new Error('Error while creating app user role mapping');
      }
      return userDetails;
    } catch (err) {
      LoggingUtils.error(err);
    }
  }

  async createUserUsingUAM(requestData: string): Promise<any> {
    try {
      let appRoleInstance: any,
        jsonObject: any,
        appUserInstance: any = {},
        isacUsers: any;
      if (!this.isValidRequest('addUser', requestData)) {
        return this.xmlResponse({message: 'INVALID REQUEST', statusCode: 25, uniqueNumber: null});
      }

      const xmlToJsonObj = convert.xml2js(requestData, {compact: true, sanitize: true});
      jsonObject = xmlToJsonObj;
      // const response = fs.writeFileSync('requestXml.json', JSON.stringify(jsonObject), {encoding: 'utf8'});

      this.getAllParamsFromRequest(jsonObject, 'addUser');
      // jsonObject.emailId = jsonObject['s:Envelope']['s:Body']['addUser']['in']['email_id']['_text'];
      // jsonObject.userName = jsonObject['s:Envelope']['s:Body']['addUser']['in']['user_name']['_text'];
      // jsonObject.uniqueNumber = jsonObject['s:Envelope']['s:Body']['addUser']['in']['unique_number']['_text'];
      // jsonObject.contactNumber = jsonObject['s:Envelope']['s:Body']['addUser']['in']['mobile']['_text'];
      // jsonObject.roleId = jsonObject['s:Envelope']['s:Body']['addUser']['in']['role_id']['_text'];
      // jsonObject.empCode = jsonObject['s:Envelope']['s:Body']['addUser']['in']['login_id']['_text'];
      // jsonObject.userType = jsonObject['s:Envelope']['s:Body']['addUser']['in']['user_type']['_text'];
      // jsonObject.category = jsonObject['s:Envelope']['s:Body']['addUser']['in']['category']['_text'];
      // jsonObject.dateOfBirth = jsonObject['s:Envelope']['s:Body']['addUser']['in']['date_of_birth']['_text'];
      // jsonObject.salutation = jsonObject['s:Envelope']['s:Body']['addUser']['in']['salutation']['_text'];
      // jsonObject.gender = jsonObject['s:Envelope']['s:Body']['addUser']['in']['gender']['_text'];
      // jsonObject.branchCode = jsonObject['s:Envelope']['s:Body']['addUser']['in']['branch_code']['_text'];
      // jsonObject.branchName = jsonObject['s:Envelope']['s:Body']['addUser']['in']['branch_name']['_text'];
      // jsonObject.departmentCode = jsonObject['s:Envelope']['s:Body']['addUser']['in']['department_code']['_text'];
      // jsonObject.departmentName = jsonObject['s:Envelope']['s:Body']['addUser']['in']['department_name']['_text'];
      // jsonObject.maxAllowedLoginAttempts = +(jsonObject['s:Envelope']['s:Body']['addUser']['in']['max_allowed_login_attempts']['_text'])

      const previousResponse = await this.isDuplicateRequest(jsonObject.uniqueNumber);
      if (previousResponse && previousResponse?.responseObject) {
        return this.xmlResponse(previousResponse?.responseObject, true);
      }

      jsonObject.activity = 'ADD';
      const emailParts = jsonObject.emailId.split('@');
      if (
        !jsonObject.emailId ||
        !ValidationUtils.validateEmail(jsonObject.emailId) ||
        !(emailParts[1] && ['HDFCBANK.COM', 'IN.HDFCBANK.COM'].includes(emailParts[1].toUpperCase()))
      ) {
        return this.xmlResponse({message: 'INVALID EMAILID', statusCode: 9, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (!jsonObject.empCode) {
        return this.xmlResponse({message: 'INVALID LOGIN ID', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (!jsonObject.employeeCode || !/^[a-zA-Z0-9]{1,20}$/i.test(jsonObject.employeeCode)) {
        return this.xmlResponse({message: 'INVALID EMPLOYEE CODE', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      // if (!jsonObject.userType || [Option.GLOBALOPTIONS.USERTYPE['general'].value].indexOf(Number(jsonObject.userType)) == -1) {
      //   return this.xmlResponse({message: 'INVALID USER TYPE', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      // }
      // jsonObject.userType = Number(jsonObject.userType);


      if (!jsonObject.category || categories.indexOf(Number(jsonObject.category)) == -1) {
        return this.xmlResponse({message: 'INVALID CATEGORY', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (!jsonObject.userName || !/^[a-zA-Z0-9' ]*$/.test(jsonObject.userName)) {
        return this.xmlResponse({message: 'INVALID USER NAME', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (jsonObject.dateOfBirth && !moment(jsonObject.dateOfBirth, 'DDMMYYYY').isValid()) {
        return this.xmlResponse({message: 'INVALID DATE OF BIRTH', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (jsonObject.contactNumber && !ValidationUtils.validateMobileNumber(jsonObject.contactNumber)) {
        return this.xmlResponse({message: 'INVALID CONTACT NUMBER', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (jsonObject.salutation && salutations.indexOf(Number(jsonObject.salutation)) == -1) {
        return this.xmlResponse({message: 'INVALID SALUTATION', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (jsonObject.gender && genders.indexOf(Number(jsonObject.gender)) == -1) {
        return this.xmlResponse({message: 'INVALID GENDER', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (jsonObject.gender && genders.indexOf(Number(jsonObject.gender)) == -1) {
        return this.xmlResponse({message: 'INVALID GENDER', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (!jsonObject.branchCode) {
        return this.xmlResponse({message: 'INVALID BRANCH CODE', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (!jsonObject.branchName) {
        return this.xmlResponse({message: 'INVALID BRANCH NAME', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (!jsonObject.departmentCode) {
        return this.xmlResponse({message: 'INVALID DEPARTMENT CODE', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (!jsonObject.departmentName) {
        return this.xmlResponse({message: 'INVALID DEPARTMENT NAME', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      // if (!jsonObject.maxAllowedLoginAttempts || jsonObject.maxAllowedLoginAttempts < 1 || jsonObject.maxAllowedLoginAttempts > 5){
      //   return this.xmlResponse({message: 'INVALID VALUE FOR MAX ALLOWED LOGIN ATTEMPTS', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      // }
      jsonObject.empCode = jsonObject.empCode.toUpperCase();

      if (!jsonObject.roleId) {
        return this.xmlResponse({message: 'INVALID ROLE ID', statusCode: 4, uniqueNumber: jsonObject.uniqueNumber});
      }
      const rawResult = await this.appRoleRepository.find({
        where: {
          id: jsonObject.roleId,
          isActive: true
        }
      });

      if (!rawResult.length) {
        return this.xmlResponse({message: 'INVALID ROLE ID', statusCode: 4, uniqueNumber: jsonObject.uniqueNumber});
      }
      const foundRole = await this.appRoleRepository.findOne({
        where: {
          id: rawResult[0]['id'],
          isActive: true
        }
      });
      if (!foundRole) {
        return this.xmlResponse({message: 'INVALID ROLE ID', statusCode: 4, uniqueNumber: jsonObject.uniqueNumber});
      }
      appRoleInstance = foundRole;
      const rawAppUser = await this.appUserRepository.find({
        where: {
          userCode: jsonObject.empCode
          // isActive: true --commenting this out because user is dormant
        }
      });
      // Reject if existing non-ETL user
      if (
        rawAppUser &&
        rawAppUser.length > 0 &&
        rawAppUser[0]['appUserStatus'] != Option.GLOBALOPTIONS.APPUSERSTATUS['pendingRegistration'].value
      ) {
        return this.xmlResponse({message: 'USERID/EMPCODE ALREADY EXISTS!', statusCode: 2, uniqueNumber: jsonObject.uniqueNumber});
      }

      let dobToSave: string | null = jsonObject.dateOfBirth ? moment.utc(jsonObject.dateOfBirth, 'DDMMYYYY').format('YYYY-MM-DD') : null;

      const maxPossibleLoginAttempts = await this.uamLoginAttemptsConfigRepository.findById(1);
      const savedUser = await this.saveNonRMUserDetails(
        {
          currentAppUser: {id: null}
        },
        {
          name: jsonObject.userName,
          email: ('' + jsonObject.emailId).trim(),
          dob: dobToSave,
          profile: appRoleInstance.name,
          userCode: jsonObject.empCode,
          activity: jsonObject.activity,
          category: jsonObject.category,
          gender: jsonObject.gender ? jsonObject.gender : null,
          salutation: jsonObject.salutation ? jsonObject.salutation : null,
          contactNumber: jsonObject.contactNumber ? jsonObject.contactNumber : null,
          // maxAllowedLoginAttempts : maxPossibleLoginAttempts?.maxLoginAttempts,
          // accountExpiry: moment('2049-12-31').endOf('day'),
          //reportingToCode: jsonObject.reportingManagerCode,
          userType: 2,
          appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['pendingRegistration'].value
        },
        appRoleInstance.id
      );
      if (!savedUser) {
        throw new Error('Error while creating non RM user');
      }
      const userData = await this.appUserRepository.findOne({
        where: {
          userCode: jsonObject.empCode,
          isActive: true
        },
        include: [
          {
            relation: 'operationDetails'
          },
          {
            relation: 'appRoles'
          }
        ],
        order: ['createdDate DESC']
      });
      appUserInstance = userData;
      appUserInstance.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS['active'].value;
      appUserInstance.isActive = true;
      appUserInstance.makerDateTimestamp = new Date();
      appUserInstance.checkerDateTimestamp = new Date();
      const createAppUser = await this.appUserRepository.updateAll(appUserInstance, {id: appUserInstance.id});
      if (!createAppUser) {
        throw new Error('Error while creating User');
      }
      let relatedData;
      if (appUserInstance.operationDetails && appUserInstance.operationDetails.userType == Option.GLOBALOPTIONS.USERTYPE['general'].value) {
        relatedData = appUserInstance.operationDetails;
      }
      const createUAMIntegration = await this.create({
        userCode: appUserInstance.userCode,
        userName: appUserInstance.name,
        newEmail: appUserInstance.email,
        email: appUserInstance.email,
        employeeCode: jsonObject.employeeCode,
        newEmployeeName: appUserInstance.name,
        dob: dobToSave == null || dobToSave == '' ? null : new Date(dobToSave),
        newDob: relatedData && relatedData.birthDate ? relatedData.birthDate : null,
        status: Option.GLOBALOPTIONS.APPUSERSTATUS['active'].label,
        appUserId: appUserInstance.id, // related appUser
        isLatest: true,
        profile: appRoleInstance.name,
        newProfileName: appRoleInstance.name,
        newSalutation: appUserInstance.salutation,
        newCategory: relatedData && relatedData.category ? relatedData.category : null,
        activity: 'ADD',
        userType: appUserInstance.userType,
        newUserType: appUserInstance.userType,
        contactNumber: jsonObject.contactNumber,
        newContactNumber: jsonObject.contactNumber,
        creationDateTime: new Date(),
        category: relatedData && relatedData.category ? relatedData.category : null,
        newGender: appUserInstance.gender ? appUserInstance.gender : null,
        gender: appUserInstance.gender ? appUserInstance.gender : null,
        lastModifiedMakerId: 'ISACMAK',
        lastModifiedCheckerId: 'SYSTEM',
        lastModifiedMakerDateTime: new Date(),
        lastModifiedCheckerDateTime: new Date(),
        branchCode: jsonObject.branchCode,
        branchName: jsonObject.branchName,
        departmentCode: jsonObject.departmentCode,
        departmentName: jsonObject.departmentName
        // maxAllowedLoginAttempts : relatedData.maxAllowedLoginAttempts
      });
      if (!createUAMIntegration) {
        throw new Error('Error while creating UAM Integration');
      }
      let UAMLogs: UamIntegrationLogsFields = {
        userCode: createUAMIntegration.userCode,
        status: createUAMIntegration.status,
        activity: createUAMIntegration.activity,
        lastModifiedMakerId: createUAMIntegration.lastModifiedMakerId,
        lastModifiedCheckerId: createUAMIntegration.lastModifiedCheckerId
      };
      LoggingUtils.info(UAMLogs, 'User Created');
      return this.xmlResponse({message: 'success', statusCode: 0, uniqueNumber: jsonObject.uniqueNumber});
    } catch (err) {
      LoggingUtils.error(err);
      return this.xmlResponse({message: 'Failure', statusCode: 1, err});
    }
  }

  async disableUserUsingUAM(requestData: string): Promise<any> {
    try {
      const xmlToJsonObj = convert.xml2js(requestData, {compact: true, sanitize: true});
      let jsonObject: any = {};
      jsonObject = xmlToJsonObj;
      // const response = fs.writeFileSync('requestXmlDisable.json', JSON.stringify(jsonObject), {encoding: 'utf8'});
      let appUserInstance: any;

      if (!this.isValidRequest('disableUser', xmlToJsonObj)) {
        return this.xmlResponse({message: 'INVALID REQUEST', statusCode: 25, uniqueNumber: null});
      }
      jsonObject.activity = 'DISABLE';
      jsonObject.empCode = jsonObject['s:Envelope']['s:Body']['disableUser']['in']['login_id']['_text'];
      jsonObject.uniqueNumber = jsonObject['s:Envelope']['s:Body']['disableUser']['in']['unique_number']['_text'];

      if (!jsonObject.empCode) {
        return this.xmlResponse({message: 'INVALID FIELD DATA', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      jsonObject.empCode = jsonObject.empCode.toUpperCase();
      const previousResponse = await this.isDuplicateRequest(jsonObject.uniqueNumber);
      if (previousResponse && previousResponse?.responseObject) {
        return this.xmlResponse(previousResponse.responseObject, true);
      }
      const appUser = await this.appUserRepository.findOne({
        where: {
          userCode: jsonObject.empCode
          // isActive: true
        }
      });
      appUserInstance = appUser;

      if (!appUserInstance) {
        return this.xmlResponse({message: 'USERID DOES NOT EXISTS', statusCode: 3, uniqueNumber: jsonObject.uniqueNumber});
      }
      let currentAppUserStatus: string = await this.returnAppUserStatusLabel(appUserInstance.appUserStatus);
      if (appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.disabled.value) {
        return this.xmlResponse({message: 'USERID ALREADY DISABLE', statusCode: 11, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.value) {
        return this.xmlResponse({message: 'USERID IS DELETED CANNOT BE MODIFIED', statusCode: 18, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (
        !(
          appUserInstance.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.locked.value ||
          appUserInstance.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.dormant.value ||
          appUserInstance.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.active.value
        )
      ) {
        return this.xmlResponse({
          message: `USER IS CURRENTLY IN ${currentAppUserStatus} STATE`,
          statusCode: 18,
          uniqueNumber: jsonObject.uniqueNumber
        });
      }
      appUserInstance.makerDateTimestamp = new Date();
      // appUserInstance.confirmedByAppUserId = isacUsers.checker.id;
      appUserInstance.checkerDateTimestamp = new Date();
      appUserInstance.previousStatus = appUserInstance.appUserStatus;
      // appUserInstance.authStatus = UAMIntegration.app.models.Option.globalOptions.AUTHSTATUS['authorized'].value;
      appUserInstance.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS['disabled'].value;
      appUserInstance.isActive = false;
      appUserInstance.lastModifiedDate = new Date();
      const createAppUser = await this.appUserRepository.updateAll(appUserInstance, {id: appUserInstance.id});
      if (!createAppUser) {
        throw new Error('Error while creating User');
      }
      const uamLog = await this.uamIntegrationRepository.findOne({
        where: {
          userCode: jsonObject.empCode,
          isLatest: true
          // isActive: true
        }
      });
      if (uamLog) {
        let UAMData: any = uamLog.toJSON();
        // Use old record to create new record and mark this record as old
        uamLog.isLatest = false;

        delete UAMData.id;

        UAMData.isLatest = true;
        UAMData.oldProfileName = null;
        UAMData.oldEmployeeName = null;
        UAMData.oldEmail = null;
        UAMData.oldProfileName = null;
        UAMData.oldBranchName = null;
        UAMData.oldDepartmentName = null;
        UAMData.oldDob = null;
        UAMData.oldSalutation = null;
        UAMData.oldCategory = null;
        UAMData.oldUserType = null;
        UAMData.oldContactNumber = null;
        UAMData.oldDepartmentCode = null;
        UAMData.oldBranchCode = null;
        UAMData.oldReportingManagerCode = null;
        UAMData.oldGender = null;
        UAMData.newProfileName = null;
        UAMData.newEmployeeName = null;
        UAMData.newEmail = null;
        UAMData.newProfileName = null;
        UAMData.newBranchName = null;
        UAMData.newDepartmentName = null;
        UAMData.newDob = null;
        UAMData.newSalutation = null;
        UAMData.newCategory = null;
        UAMData.newUserType = null;
        UAMData.newContactNumber = null;
        UAMData.newDepartmentCode = null;
        UAMData.newBranchCode = null;
        UAMData.newReportingManagerCode = null;
        UAMData.newGender = null;

        UAMData.status = Option.GLOBALOPTIONS.APPUSERSTATUS['disabled'].label;
        UAMData.lastLoginDate = jsonObject.lastLoginDate;
        UAMData.activity = jsonObject.activity;
        UAMData.disableDateTime = new Date();
        UAMData.isActive = false;
        UAMData.dormantDateTime = null;
        UAMData.deletionDateTime = null;
        (UAMData.lastModifiedMakerId = 'ISACMAK'),
          (UAMData.lastModifiedCheckerId = 'SYSTEM'),
          await this.uamIntegrationRepository.updateAll(uamLog, {id: uamLog.id});
        const updateUamIntegration = await this.create(UAMData);
        if (!updateUamIntegration) {
          throw new Error('Error while updating UAM Integration');
        }
        let UAMLogs: UamIntegrationLogsFields = {
          userCode: updateUamIntegration.userCode,
          status: updateUamIntegration.status,
          activity: updateUamIntegration.activity,
          lastModifiedMakerId: updateUamIntegration.lastModifiedMakerId,
          lastModifiedCheckerId: updateUamIntegration.lastModifiedCheckerId,
          disableDateTime: updateUamIntegration.disableDateTime
        };
        LoggingUtils.info(UAMLogs, 'User Disabled');
      }
      await this.appAccessTokenRepository.updateAll({isActive: false}, {isActive: true, appUserId: appUser?.id});
      return this.xmlResponse({message: 'success', statusCode: 0, uniqueNumber: jsonObject.uniqueNumber});
    } catch (err) {
      return this.xmlResponse({message: 'Failure', statusCode: 1, err});
    }
  }

  async enableUserUsingUAM(requestData: string): Promise<any> {
    try {
      let appUserInstance: any;
      const xmlToJsonObj = convert.xml2js(requestData, {compact: true, sanitize: true});
      let jsonObject: any = {};
      jsonObject = xmlToJsonObj;
      let changedFromDormant : boolean = false
      // const response = fs.writeFileSync('requestXmlEnable.json', JSON.stringify(jsonObject), {encoding: 'utf8'});

      if (!this.isValidRequest('unlockUser', xmlToJsonObj)) {
        return this.xmlResponse({message: 'INVALID REQUEST', statusCode: 25, uniqueNumber: null});
      }
      jsonObject.activity = 'ENABLE';
      jsonObject.empCode = jsonObject['s:Envelope']['s:Body']['enableUser']['in']['login_id']['_text'];
      jsonObject.uniqueNumber = jsonObject['s:Envelope']['s:Body']['enableUser']['in']['unique_number']['_text'];

      if (!jsonObject.empCode) {
        return this.xmlResponse({message: 'INVALID FIELD DATA', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }

      jsonObject.empCode = jsonObject.empCode.toUpperCase();

      const previousResponse = await this.isDuplicateRequest(jsonObject.uniqueNumber);
      if (previousResponse && previousResponse?.responseObject) {
        return this.xmlResponse(previousResponse.responseObject, true);
      }
      const appUser = await this.appUserRepository.findOne({
        where: {
          userCode: jsonObject.empCode
        },
        include: ['operationDetails', 'appRoles']
      });

      if (!appUser) {
        return this.xmlResponse({message: 'USERID DOES NOT EXISTS', statusCode: 3, uniqueNumber: jsonObject.uniqueNumber});
      }

      let currentAppUserStatus: string = await this.returnAppUserStatusLabel(appUser.appUserStatus);
      if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.active.value) {
        return this.xmlResponse({message: `USERID ALREADY IN ACTIVE STATUS`, statusCode: 10, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (appUser.appUserStatus != Option.GLOBALOPTIONS.APPUSERSTATUS.disabled.value && appUser.appUserStatus != Option.GLOBALOPTIONS.APPUSERSTATUS.dormant.value) {
        return this.xmlResponse({
          message: `USER IS CURRENTLY IN ${currentAppUserStatus} STATE`,
          statusCode: 10,
          uniqueNumber: jsonObject.uniqueNumber
        });
      }

      if(appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.dormant.value) changedFromDormant = true // We are setting this to mark if the user was enabled from dormant status recently

      // if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.locked.value) {
      //   return this.xmlResponse({message: 'USERID IS LOCKED CANNOT BE ENABLED', statusCode: 19, uniqueNumber: jsonObject.uniqueNumber});
      // }
      // if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.value) {
      //   return this.xmlResponse({message: 'USERID IS DELETED CANNOT BE ENABLED', statusCode: 18, uniqueNumber: jsonObject.uniqueNumber});
      // }
      appUserInstance = appUser;
      jsonObject.lastLoginDate = appUser.lastLoginDate;
      appUserInstance.makerDateTimestamp = new Date();
      //appUserInstance.confirmedByAppUserId = isacUsers.checker.id;
      appUserInstance.checkerDateTimestamp = new Date();
      appUserInstance.previousStatus = appUserInstance.appUserStatus;
      // appUserInstance.authStatus = UAMIntegration.app.models.Option.globalOptions.AUTHSTATUS['authorized'].value;
      appUserInstance.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS['active'].value;
      appUserInstance.isActive = true;
      appUserInstance.lastModifiedDate = new Date();
      const createAppUser = await this.appUserRepository.updateAll(appUserInstance, {id: appUserInstance.id});
      if (!createAppUser) {
        throw new Error('Error while creating User');
      }
      const uamLog = await this.uamIntegrationRepository.findOne({
        where: {
          userCode: jsonObject.empCode,
          isLatest: true
        }
      });
      if (uamLog) {
        let UAMData: any = uamLog.toJSON();
        // Use old record to create new record and mark this record as old
        uamLog.isLatest = false;
        delete UAMData.id;
        UAMData.isLatest = true;

        UAMData.oldProfileName = null;
        UAMData.oldEmployeeName = null;
        UAMData.oldEmail = null;
        UAMData.oldProfileName = null;
        UAMData.oldBranchName = null;
        UAMData.oldDepartmentName = null;
        UAMData.oldDob = null;
        UAMData.oldSalutation = null;
        UAMData.oldCategory = null;
        UAMData.oldUserType = null;
        UAMData.oldContactNumber = null;
        UAMData.oldDepartmentCode = null;
        UAMData.oldBranchCode = null;
        UAMData.oldReportingManagerCode = null;
        UAMData.oldGender = null;
        UAMData.newProfileName = null;
        UAMData.newEmployeeName = null;
        UAMData.newEmail = null;
        UAMData.newProfileName = null;
        UAMData.newBranchName = null;
        UAMData.newDepartmentName = null;
        UAMData.newDob = null;
        UAMData.newSalutation = null;
        UAMData.newCategory = null;
        UAMData.newUserType = null;
        UAMData.newContactNumber = null;
        UAMData.newDepartmentCode = null;
        UAMData.newBranchCode = null;
        UAMData.newReportingManagerCode = null;
        UAMData.newGender = null;

        UAMData.disableDateTime = null;
        UAMData.dormantDateTime = null;
        UAMData.deletionDateTime = null;
        UAMData.status = Option.GLOBALOPTIONS.APPUSERSTATUS['active'].label;
        UAMData.lastLoginDate = jsonObject.lastLoginDate;
        UAMData.activity = jsonObject.activity;
        UAMData.isActive = true;
        UAMData.enabledFromDormancyRecently = changedFromDormant,
        (UAMData.lastModifiedMakerId = 'ISACMAK'),
          (UAMData.lastModifiedCheckerId = 'SYSTEM'),
          await this.uamIntegrationRepository.updateAll(uamLog, {id: uamLog.id});
        const updateUamIntegration = await this.create(UAMData);
        if (!updateUamIntegration) {
          throw new Error('Error while updating UAM Integration');
        }
        const UamLogs: UamIntegrationLogsFields = {
          userCode: updateUamIntegration.userCode,
          status: updateUamIntegration.status,
          activity: updateUamIntegration.activity,
          lastModifiedMakerId: updateUamIntegration.lastModifiedMakerId,
          lastModifiedCheckerId: updateUamIntegration.lastModifiedCheckerId
        };
        LoggingUtils.info(UamLogs, 'User enabled');
      }
      return this.xmlResponse({message: 'success', statusCode: 0, uniqueNumber: jsonObject.uniqueNumber});
    } catch (err) {
      return this.xmlResponse({message: 'Failure', statusCode: 1, err});
    }
  }

  async deleteUserUsingUAM(requestData: string): Promise<any> {
    try {
      let appUserInstance: any;
      const xmlToJsonObj = convert.xml2js(requestData, {compact: true, sanitize: true});
      let jsonObject: any = {};
      jsonObject = xmlToJsonObj;
      // const response = fs.writeFileSync('requestXmlDelete.json', JSON.stringify(jsonObject), {encoding: 'utf8'});

      if (!this.isValidRequest('deleteUser', xmlToJsonObj)) {
        return this.xmlResponse({message: 'INVALID REQUEST', statusCode: 25, uniqueNumber: null});
      }
      jsonObject.activity = 'DELETE';
      jsonObject.empCode = jsonObject['s:Envelope']['s:Body']['deleteUser']['in']['login_id']['_text'];
      jsonObject.uniqueNumber = jsonObject['s:Envelope']['s:Body']['deleteUser']['in']['unique_number']['_text'];
      if (!jsonObject.empCode) {
        return this.xmlResponse({message: 'INVALID FIELD DATA', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      jsonObject.empCode = jsonObject.empCode.toUpperCase();

      const previousResponse = await this.isDuplicateRequest(jsonObject.uniqueNumber);
      if (previousResponse && previousResponse?.responseObject) {
        return this.xmlResponse(previousResponse.responseObject, true);
      }
      const appUser = await this.appUserRepository.findOne({
        where: {
          userCode: jsonObject.empCode,
          // isActive: true
        },
        include: ['operationDetails', 'appRoles']
      });
      if (!appUser) {
        return this.xmlResponse({message: 'USERID DOES NOT EXISTS', statusCode: 3, uniqueNumber: jsonObject.uniqueNumber});
      }
      // let currentAppUserStatus : string = await this.returnAppUserStatusLabel(appUser.appUserStatus)

      if (appUser.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.value) {
        return this.xmlResponse({message: 'USERID ALREADY DELETED', statusCode: 16, uniqueNumber: jsonObject.uniqueNumber});
      }
      appUserInstance = appUser;
      jsonObject.lastLoginDate = appUser.lastLoginDate;
      appUserInstance.previousStatus = appUserInstance.appUserStatus;
      appUserInstance.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS['deleted'].value;
      appUserInstance.isActive = false;
      appUserInstance.lastModifiedDate = new Date();

      const createAppUser = await this.appUserRepository.updateAll(appUserInstance, {id: appUserInstance.id});
      if (!createAppUser) {
        throw new Error('Error while creating User');
      }

      const uamLog = await this.uamIntegrationRepository.findOne({
        where: {
          userCode: jsonObject.empCode,
          isLatest: true
        }
      });

      if (uamLog) {
        let UAMData: any = uamLog.toJSON();
        // Use old record to create new record and mark this record as old
        uamLog.isLatest = false;
        delete UAMData.id;

        UAMData.isLatest = true;
        UAMData.oldEmployeeName = null;
        UAMData.oldEmail = null;
        UAMData.oldDob = null;
        UAMData.oldSalutation = null;
        UAMData.oldCategory = null;
        UAMData.oldUserType = null;
        UAMData.oldContactNumber = null;
        UAMData.oldGender = null;
        UAMData.newEmployeeName = null;
        UAMData.newEmail = null;
        UAMData.newDob = null;
        UAMData.newSalutation = null;
        UAMData.newCategory = null;
        UAMData.newUserType = null;
        UAMData.newContactNumber = null;
        UAMData.newGender = null;
        UAMData.disableDateTime = null;
        UAMData.status = Option.GLOBALOPTIONS.APPUSERSTATUS['deleted'].label;
        UAMData.lastLoginDate = jsonObject.lastLoginDate;
        UAMData.activity = jsonObject.activity;
        UAMData.deletionDateTime = new Date();
        UAMData.isActive = false;
        UAMData.dormantDateTime = null;
        (UAMData.lastModifiedMakerId = 'ISACMAK'),
          (UAMData.lastModifiedCheckerId = 'SYSTEM'),
          await this.uamIntegrationRepository.updateAll(uamLog, {id: uamLog.id});
        const updateUamIntegration = await this.create(UAMData);
        if (!updateUamIntegration) {
          throw new Error('Error while updating UAM Integration');
        }
        const UamLogs: UamIntegrationLogsFields = {
          userCode: updateUamIntegration.userCode,
          status: updateUamIntegration.status,
          activity: updateUamIntegration.activity,
          lastModifiedMakerId: updateUamIntegration.lastModifiedMakerId,
          lastModifiedCheckerId: updateUamIntegration.lastModifiedCheckerId
        };
        LoggingUtils.info(UamLogs, 'User deleted');
      }
      await this.appAccessTokenRepository.updateAll({isActive: false}, {isActive: true, appUserId: appUser?.id});
      return this.xmlResponse({message: 'success', statusCode: 0, uniqueNumber: jsonObject.uniqueNumber});
    } catch (err) {
      return this.xmlResponse({message: 'Failure', statusCode: 1, err});
    }
  }

  async reopenUserUsingUAM(requestData: string): Promise<any> {
    try {
      let appUserInstance: any;
      const xmlToJsonObj = convert.xml2js(requestData, {compact: true, sanitize: true});
      let jsonObject: any = {};
      jsonObject = xmlToJsonObj;
      //  const response = fs.writeFileSync('requestXmlReopen.json', JSON.stringify(jsonObject), {encoding: 'utf8'});

      if (!this.isValidRequest('reopenUser', xmlToJsonObj)) {
        return this.xmlResponse({message: 'INVALID REQUEST', statusCode: 25, uniqueNumber: null});
      }
      jsonObject.activity = 'REOPEN';
      jsonObject.empCode = jsonObject['s:Envelope']['s:Body']['reopenUser']['in']['login_id']['_text'];
      jsonObject.uniqueNumber = jsonObject['s:Envelope']['s:Body']['reopenUser']['in']['unique_number']['_text'];

      if (!jsonObject.empCode) {
        return this.xmlResponse({message: 'INVALID FIELD DATA', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      jsonObject.empCode = jsonObject.empCode.toUpperCase();

      const previousResponse = await this.isDuplicateRequest(jsonObject.uniqueNumber);
      if (previousResponse && previousResponse?.responseObject) {
        return this.xmlResponse(previousResponse.responseObject, true);
      }
      const appUser = await this.appUserRepository.findOne({
        where: {
          userCode: jsonObject.empCode
        },
        include: ['operationDetails', 'appRoles']
      });

      if (!appUser) {
        return this.xmlResponse({message: 'USERID DOES NOT EXISTS', statusCode: 3, uniqueNumber: jsonObject.uniqueNumber});
      }
      let currentAppUserStatus: string = await this.returnAppUserStatusLabel(appUser.appUserStatus);

      if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.active.value) {
        return this.xmlResponse({message: `USERID ALREADY IN ACTIVE STATUS`, statusCode: 10, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.disabled.value) {
        return this.xmlResponse({
          message: `USER IS CURRENTLY IN ${currentAppUserStatus} STATE`,
          statusCode: 20,
          uniqueNumber: jsonObject.uniqueNumber
        });
      }
      if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.locked.value) {
        return this.xmlResponse({
          message: `USER IS CURRENTLY IN ${currentAppUserStatus} STATE`,
          statusCode: 19,
          uniqueNumber: jsonObject.uniqueNumber
        });
      }
      if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.suspended.value) {
        return this.xmlResponse({
          message: `USER IS CURRENTLY IN ${currentAppUserStatus} STATE`,
          statusCode: 21,
          uniqueNumber: jsonObject.uniqueNumber
        });
      }
      if (appUser.appUserStatus != Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.value) {
        return this.xmlResponse({
          message: `USER IS CURRENTLY IN ${currentAppUserStatus} STATE`,
          statusCode: 21,
          uniqueNumber: jsonObject.uniqueNumber
        });
      }
      jsonObject.lastLoginDate = appUser.lastLoginDate;
      appUserInstance = appUser;

      appUserInstance.loginRetryCount = 0;
      appUserInstance.previousStatus = appUserInstance.appUserStatus;
      // will need to update accountExpiry later with model config of same
      //appUserInstance.accountExpiry = moment('2049-12-31').endOf('day');
      // appUserInstance.authStatus = Option.globalOptions.AUTHSTATUS['authorized'].value;
      appUserInstance.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS['active'].value;
      appUserInstance.isActive = true;
      appUserInstance.lastModifiedDate = new Date();
      const createAppUser = await this.appUserRepository.updateAll(appUserInstance, {id: appUserInstance.id});
      if (!createAppUser) {
        throw new Error('Error while creating User');
      }
      const uamLog = await this.uamIntegrationRepository.findOne({
        where: {
          userCode: jsonObject.empCode,
          isLatest: true
        }
      });
      if (uamLog) {
        let UAMData: any = uamLog.toJSON();
        // Use old record to create new record and mark this record as old
        uamLog.isLatest = false;
        delete UAMData.id;
        UAMData.isLatest = true;

        UAMData.oldProfileName = null;
        UAMData.oldEmployeeName = null;
        UAMData.oldEmail = null;
        UAMData.oldProfileName = null;
        UAMData.oldBranchName = null;
        UAMData.oldDepartmentName = null;
        UAMData.oldDob = null;
        UAMData.oldSalutation = null;
        UAMData.oldCategory = null;
        UAMData.oldUserType = null;
        UAMData.oldContactNumber = null;
        UAMData.oldDepartmentCode = null;
        UAMData.oldBranchCode = null;
        UAMData.oldReportingManagerCode = null;
        UAMData.oldGender = null;
        UAMData.newProfileName = null;
        UAMData.newEmployeeName = null;
        UAMData.newEmail = null;
        UAMData.newProfileName = null;
        UAMData.newBranchName = null;
        UAMData.newDepartmentName = null;
        UAMData.newDob = null;
        UAMData.newSalutation = null;
        UAMData.newCategory = null;
        UAMData.newUserType = null;
        UAMData.newContactNumber = null;
        UAMData.newDepartmentCode = null;
        UAMData.newBranchCode = null;
        UAMData.newReportingManagerCode = null;
        UAMData.newGender = null;

        UAMData.deletionDateTime = null;
        UAMData.dormantDateTime = null;
        UAMData.disableDateTime = null;
        UAMData.status = Option.GLOBALOPTIONS.APPUSERSTATUS['active'].label;
        UAMData.lastLoginDate = jsonObject.lastLoginDate;
        UAMData.activity = jsonObject.activity;
        UAMData.isActive = true;
        (UAMData.lastModifiedMakerId = 'ISACMAK'),
          (UAMData.lastModifiedCheckerId = 'SYSTEM'),
          await this.uamIntegrationRepository.updateAll(uamLog, {id: uamLog.id});
        const updateUamIntegration = await this.create(UAMData);
        if (!updateUamIntegration) {
          throw new Error('Error while updating UAM Integration');
        }
        const UamLogs: UamIntegrationLogsFields = {
          userCode: updateUamIntegration.userCode,
          status: updateUamIntegration.status,
          activity: updateUamIntegration.activity,
          lastModifiedMakerId: updateUamIntegration.lastModifiedMakerId,
          lastModifiedCheckerId: updateUamIntegration.lastModifiedCheckerId
        };
        LoggingUtils.info(UamLogs, 'User re-opened');
      }
      return this.xmlResponse({message: 'success', statusCode: 0, uniqueNumber: jsonObject.uniqueNumber});
    } catch (err) {
      return this.xmlResponse({message: 'Failure', statusCode: 1, err});
    }
  }

  async unlockUserUsingUAM(requestData: string): Promise<any> {
    try {
      let appUserInstance: any;
      const xmlToJsonObj = convert.xml2js(requestData, {compact: true, sanitize: true});
      let jsonObject: any = {};
      jsonObject = xmlToJsonObj;
      // const response = fs.writeFileSync('requestXmlunBloack.json', JSON.stringify(jsonObject), {encoding: 'utf8'});

      if (!this.isValidRequest('unlockUser', xmlToJsonObj)) {
        return this.xmlResponse({message: 'INVALID REQUEST', statusCode: 25, uniqueNumber: null});
      }

      jsonObject.activity = 'UNLOCK';

      jsonObject.empCode = jsonObject['s:Envelope']['s:Body']['unlockUser']['in']['login_id']['_text'];
      jsonObject.uniqueNumber = jsonObject['s:Envelope']['s:Body']['unlockUser']['in']['unique_number']['_text'];
      if (!jsonObject.empCode) {
        return this.xmlResponse({message: 'INVALID FIELD DATA', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      jsonObject.empCode = jsonObject.empCode.toUpperCase();

      const previousResponse = await this.isDuplicateRequest(jsonObject.uniqueNumber);
      if (previousResponse && previousResponse?.responseObject) {
        return this.xmlResponse(previousResponse.responseObject, true);
      }
      const appUser = await this.appUserRepository.findOne({
        where: {
          userCode: jsonObject.empCode
        }
      });
      appUserInstance = appUser;

      if (!appUserInstance) {
        return this.xmlResponse({message: 'USERID DOES NOT EXISTS', statusCode: 3, uniqueNumber: jsonObject.uniqueNumber});
      }

      let currentAppUserStatus: string = await this.returnAppUserStatusLabel(appUserInstance.appUserStatus);

      if (appUserInstance && appUserInstance.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS['active'].value) {
        return this.xmlResponse({message: 'USER IS ALREADY ACTIVE', statusCode: 5, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.disabled.value) {
        return this.xmlResponse({
          message: `USER IS CURRENTLY IN ${currentAppUserStatus} STATE`,
          statusCode: 20,
          uniqueNumber: jsonObject.uniqueNumber
        });
      }
      if (appUserInstance.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.value) {
        return this.xmlResponse({
          message: `USER IS CURRENTLY IN ${currentAppUserStatus} STATE`,
          statusCode: 18,
          uniqueNumber: jsonObject.uniqueNumber
        });
      }
      if (appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.suspended.value) {
        return this.xmlResponse({
          message: `USER IS CURRENTLY IN ${currentAppUserStatus} STATE`,
          statusCode: 21,
          uniqueNumber: jsonObject.uniqueNumber
        });
      }
      if (appUserInstance.appUserStatus != Option.GLOBALOPTIONS.APPUSERSTATUS.locked.value) {
        return this.xmlResponse({
          message: `USER IS CURRENTLY IN ${currentAppUserStatus} STATE`,
          statusCode: 21,
          uniqueNumber: jsonObject.uniqueNumber
        });
      }
      jsonObject.lastLoginDate = appUserInstance.lastLoginDate;
      appUserInstance.loginRetryCount = 0;
      appUserInstance.previousStatus = appUserInstance.appUserStatus;
      //  appUserInstance.authStatus = Option.GLOBALOPTIONS.AUTHSTATUS['authorized'].value;
      appUserInstance.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS['active'].value;
      appUserInstance.isActive = true;
      appUserInstance.lastModifiedDate = new Date();
      appUserInstance.loginRetryCount = 0;
      const createAppUser = await this.appUserRepository.updateAll(appUserInstance, {id: appUserInstance.id});
      if (!createAppUser) {
        throw new Error('Error while creating User');
      }
      const uamLog = await this.uamIntegrationRepository.findOne({
        where: {
          userCode: jsonObject.empCode,
          isLatest: true
        }
      });
      if (uamLog) {
        let UAMData: any = uamLog.toJSON();
        // Use old record to create new record and mark this record as old
        uamLog.isLatest = false;
        delete UAMData.id;
        UAMData.isLatest = true;

        UAMData.oldProfileName = null;
        UAMData.oldEmployeeName = null;
        UAMData.oldEmail = null;
        UAMData.oldProfileName = null;
        UAMData.oldBranchName = null;
        UAMData.oldDepartmentName = null;
        UAMData.oldDob = null;
        UAMData.oldSalutation = null;
        UAMData.oldCategory = null;
        UAMData.oldUserType = null;
        UAMData.oldContactNumber = null;
        UAMData.oldDepartmentCode = null;
        UAMData.oldBranchCode = null;
        UAMData.oldReportingManagerCode = null;
        UAMData.oldGender = null;
        UAMData.newProfileName = null;
        UAMData.newEmployeeName = null;
        UAMData.newEmail = null;
        UAMData.newProfileName = null;
        UAMData.newBranchName = null;
        UAMData.newDepartmentName = null;
        UAMData.newDob = null;
        UAMData.newSalutation = null;
        UAMData.newCategory = null;
        UAMData.newUserType = null;
        UAMData.newContactNumber = null;
        UAMData.newDepartmentCode = null;
        UAMData.newBranchCode = null;
        UAMData.newReportingManagerCode = null;
        UAMData.newGender = null;

        UAMData.status = Option.GLOBALOPTIONS.APPUSERSTATUS['active'].label;
        UAMData.lastLoginDate = jsonObject.lastLoginDate;
        UAMData.activity = jsonObject.activity;
        UAMData.isActive = true;
        UAMData.disableDateTime = null;
        UAMData.dormantDateTime = null;
        UAMData.deletionDateTime = null;
        (UAMData.lastModifiedMakerId = 'ISACMAK'),
          (UAMData.lastModifiedCheckerId = 'SYSTEM'),
          await this.uamIntegrationRepository.updateAll(uamLog, {id: uamLog.id});
        const updateUamIntegration = await this.create(UAMData);
        if (!updateUamIntegration) {
          throw new Error('Error while updating UAM Integration');
        }
        const UamLogs: UamIntegrationLogsFields = {
          userCode: updateUamIntegration.userCode,
          status: updateUamIntegration.status,
          activity: updateUamIntegration.activity,
          lastModifiedMakerId: updateUamIntegration.lastModifiedMakerId,
          lastModifiedCheckerId: updateUamIntegration.lastModifiedCheckerId
        };
        LoggingUtils.info(UamLogs, 'User unlocked');
      }
      return this.xmlResponse({message: 'success', statusCode: 0, uniqueNumber: jsonObject.uniqueNumber});
    } catch (err) {
      return this.xmlResponse({message: 'Failure', statusCode: 1, err});
    }
  }

  async updateUserUsingUAM(requestData: string): Promise<any> {
    try {
      let oldUAMData: any;
      let roleInstance: any, reportingToInstance: any;
      let uamInstance: any = {};
      let changedData: any = {};
      let appUserInstance: any;
      const xmlToJsonObj = convert.xml2js(requestData, {compact: true, sanitize: true});
      let jsonObject: any = {};
      jsonObject = xmlToJsonObj;
      let stateChanged = false // We'll use this to track if any of the details were updated

      //const response = fs.writeFileSync('requestXmlUpdate.json', JSON.stringify(jsonObject), {encoding: 'utf8'});

      if (!this.isValidRequest('modifyUser', xmlToJsonObj)) {
        return this.xmlResponse({message: 'INVALID REQUEST', statusCode: 25, uniqueNumber: null});
      }
      this.getAllParamsFromRequest(jsonObject, 'modifyUser');
      // this.removeEmptyParams(jsonObject);

      jsonObject.activity = 'MODIFY';

      const previousResponse = await this.isDuplicateRequest(jsonObject.uniqueNumber);
      if (previousResponse && previousResponse?.responseObject) {
        return this.xmlResponse(previousResponse?.responseObject, true);
      }

      if (jsonObject.emailId) {
        const emailParts = jsonObject.emailId.split('@');
        if (
          !jsonObject.emailId ||
          !ValidationUtils.validateEmail(jsonObject.emailId) ||
          !(emailParts[1] && ['HDFCBANK.COM', 'IN.HDFCBANK.COM'].includes(emailParts[1].toUpperCase()))
        ) {
          return this.xmlResponse({message: 'INVALID EMAILID', statusCode: 9, uniqueNumber: jsonObject.uniqueNumber});
        }
      }

      if (!jsonObject.empCode) {
        return this.xmlResponse({message: 'INVALID LOGIN ID', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (jsonObject.employeeCode && !/^[a-zA-Z0-9]{1,20}$/i.test(jsonObject.employeeCode)) {
        return this.xmlResponse({message: 'INVALID EMPLOYEE CODE', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (jsonObject.dateOfBirth) {
        if (!moment(jsonObject.dateOfBirth, 'DDMMYYYY').isValid()) {
          return this.xmlResponse({message: 'INVALID DATE OF BIRTH', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
        }
      }

      if (jsonObject.contactNumber) {
        if (!ValidationUtils.validateMobileNumber(jsonObject.contactNumber)) {
          return this.xmlResponse({message: 'INVALID CONTACT NUMBER', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
        }
      }

      if (jsonObject.salutation) {
        if (salutations.indexOf(Number(jsonObject.salutation)) == -1) {
          return this.xmlResponse({message: 'INVALID SALUTATION', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
        } else {
          jsonObject.salutation = Number(jsonObject.salutation);
        }
      }

      if (jsonObject.gender) {
        if (genders.indexOf(Number(jsonObject.gender)) == -1) {
          return this.xmlResponse({message: 'INVALID GENDER', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
        } else {
          jsonObject.gender = Number(jsonObject.gender);
        }
      }

      if (jsonObject.category) {
        if (categories.indexOf(Number(jsonObject.category)) == -1) {
          return this.xmlResponse({message: 'INVALID CATEGORY', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
        } else {
          jsonObject.category = Number(jsonObject.category);
        }
      }
      if (jsonObject.userName || jsonObject.employeeCode ) {
        return this.xmlResponse({message: 'CANNOT UPDATE USERNAME OR EMPLOYEE CODE', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      }
      // if (!jsonObject.branchCode) {
      //   return this.xmlResponse({message: 'INVALID BRANCH CODE', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      // }
      // if (!jsonObject.branchName) {
      //   return this.xmlResponse({message: 'INVALID BRANCH NAME', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      // }
      // if (!jsonObject.departmentCode) {
      //   return this.xmlResponse({message: 'INVALID DEPARTMENT CODE', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      // }
      // if (!jsonObject.departmentName) {
      //   return this.xmlResponse({message: 'INVALID DEPARTMENT NAME', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      // }

      // if (!jsonObject.maxAllowedLoginAttempts || jsonObject.maxAllowedLoginAttempts < 1 || jsonObject.maxAllowedLoginAttempts > 5){
      //   return this.xmlResponse({message: 'INVALID VALUE FOR MAX ALLOWED LOGIN ATTEMPTS', statusCode: 7, uniqueNumber: jsonObject.uniqueNumber});
      // }

      // if (
      //   !jsonObject.emailId &&
      //   !jsonObject.roleId &&
      //   !jsonObject.userName &&
      //   !jsonObject.category &&
      //   !jsonObject.salutation &&
      //   !jsonObject.gender &&
      //   !jsonObject.contactNumber &&
      //   !jsonObject.dateOfBirth
      // ) {
      //   return this.xmlResponse({message: 'EMPTY REQUEST', statusCode: 27, uniqueNumber: jsonObject.uniqueNumber});
      // }
      // jsonObject.gender = jsonObject.gender ? Number(jsonObject.gender) : null;
      // jsonObject.category = jsonObject.category ? Number(jsonObject.category) : null;
      // jsonObject.salutation = jsonObject.salutation ? Number(jsonObject.salutation) : null;
      jsonObject.empCode = jsonObject.empCode.toUpperCase();

      let rawResult, foundRole;
      if (jsonObject.roleId) {
        rawResult = await this.appRoleRepository.find({
          where: {
            id: jsonObject.roleId,
            isActive: true
          }
        });
        if (rawResult) {
          // if role change request, check if exists
          if (!rawResult.length) {
            return this.xmlResponse({message: 'INVALID ROLE ID', statusCode: 4, uniqueNumber: jsonObject.uniqueNumber});
          }

          foundRole = await this.appRoleRepository.findOne({
            where: {
              id: rawResult[0]['id'],
              isActive: true
            }
          });
        }
        if (!foundRole) {
          return this.xmlResponse({message: 'INVALID ROLE ID', statusCode: 4, uniqueNumber: jsonObject.uniqueNumber});
        }
      }
      roleInstance = foundRole;

      const UAMData = await this.uamIntegrationRepository.findOne({
        where: {
          userCode: jsonObject.empCode,
          isLatest: true
          // isActive: true
        }
      });

      if (!UAMData) {
        return this.xmlResponse({message: 'USERID DOES NOT EXISTS', statusCode: 3, uniqueNumber: jsonObject.uniqueNumber});
      }

      const currentRole = await this.appUserRoleMappingRepository
      .findOne({
        where: {
          appUserId: UAMData?.appUserId
        }
      })
      if(currentRole?.appRoleId == foundRole?.id){
        return this.xmlResponse({message: `TEMPLATE ALREADY MAPPED`, statusCode: 26, uniqueNumber: jsonObject.uniqueNumber});
      }

      uamInstance = UAMData ? UAMData.toJSON() : {};
      oldUAMData = UAMData;

      delete uamInstance.id;
      uamInstance.isLatest = true;
      uamInstance.userCode = jsonObject.empCode;
      uamInstance.employeeCode = jsonObject.employeeCode;
      uamInstance.activity = jsonObject.activity;

      const appUser = await this.appUserRepository.findOne({
        where: {
          userCode: jsonObject.empCode
          // isActive: true
        },
        include: [
          {
            relation: 'appRoles'
          },
          {
            relation: 'operationDetails'
          }
        ]
      });
      if (!appUser) {
        // user not found
        return this.xmlResponse({message: 'USERID DOES NOT EXISTS', statusCode: 3, uniqueNumber: jsonObject.uniqueNumber});
      }

      let currentAppUserStatus: string = await this.returnAppUserStatusLabel(appUser.appUserStatus);

      if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.value) {
        return this.xmlResponse({message: `USER IS CURRENTLY IN ${currentAppUserStatus} STATE`, statusCode: 13, uniqueNumber: jsonObject.uniqueNumber});
      }
      if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.locked.value) {
        return this.xmlResponse({
          message: `USER IS CURRENTLY IN ${currentAppUserStatus} STATE`,
          statusCode: 19,
          uniqueNumber: jsonObject.uniqueNumber
        });
      }
      if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.disabled.value) {
        return this.xmlResponse({
          message: `USER IS CURRENTLY IN ${currentAppUserStatus} STATE`,
          statusCode: 20,
          uniqueNumber: jsonObject.uniqueNumber
        });
      }
      if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.dormant.value) {
        return this.xmlResponse({
          message: `USER IS CURRENTLY IN ${currentAppUserStatus} STATE`,
          statusCode: 21,
          uniqueNumber: jsonObject.uniqueNumber
        });
      }
      appUserInstance = appUser;

      jsonObject.lastLoginDate = appUserInstance.lastLoginDate;
      jsonObject.appUserStatus = appUserInstance.appUserStatus;

      if (jsonObject.userName && jsonObject.userName !== appUserInstance.name) {
        stateChanged = true
        uamInstance.oldEmployeeName = appUserInstance.name;
        uamInstance.newEmployeeName = jsonObject.userName;
        changedData.name = jsonObject.userName;
        uamInstance.userName = jsonObject.userName;
      } else {
        uamInstance.userName = appUserInstance.name;
        uamInstance.oldEmployeeName = null;
        uamInstance.newEmployeeName = null;
      }

      if (jsonObject.emailId && jsonObject.emailId !== appUserInstance.email) {
        stateChanged = true
        changedData.email = jsonObject.emailId;
        uamInstance.oldEmail = appUserInstance.email;
        uamInstance.newEmail = jsonObject.emailId;
        uamInstance.email = jsonObject.emailId;
      } else {
        uamInstance.oldEmail = null;
        uamInstance.newEmail = null;
        uamInstance.email = appUserInstance.email;
      }

      if (jsonObject.contactNumber && jsonObject.contactNumber !== UAMData.contactNumber) {
        changedData.contactNumber = jsonObject.contactNumber;
      }

      if (jsonObject.gender && jsonObject.gender !== appUserInstance.gender) {
        stateChanged = true
        changedData.gender = jsonObject.gender;
        uamInstance.oldGender = appUserInstance.gender;
        uamInstance.newGender = jsonObject.gender;
        uamInstance.gender = jsonObject.gender;
      } else {
        uamInstance.oldGender = null;
        uamInstance.newGender = null;
        uamInstance.gender = appUserInstance.gender;
      }

      if (jsonObject.roleId && jsonObject.roleId != appUserInstance.appRoles[0].id) {
        stateChanged = true
        uamInstance.oldProfileName = appUserInstance.appRoles[0].name;
        uamInstance.newProfileName = roleInstance.name;
        uamInstance.profile = roleInstance.name;
        changedData.appRole = roleInstance;
      } else {
        changedData.appRoleId = appUserInstance.appRoles[0].id; // required to send roleID
        uamInstance.oldProfileName = null;
        uamInstance.newProfileName = null;
        uamInstance.profile = appUserInstance.appRoles[0].name;
      }

      if (jsonObject.salutation && jsonObject.salutation !== appUserInstance.salutation) {
        stateChanged = true
        uamInstance.oldSalutation = appUserInstance.salutation;
        uamInstance.newSalutation = jsonObject.salutation;
        uamInstance.salutation = jsonObject.salutation;
        changedData.salutation = jsonObject.salutation;
      } else {
        uamInstance.oldSalutation = null;
        uamInstance.newSalutation = null;
        uamInstance.salutation = appUserInstance.salutation;
      }
      let relatedData;
      if (appUserInstance.operationDetails.userType == Option.GLOBALOPTIONS.USERTYPE['general'].value) {
        relatedData = appUserInstance.operationDetails;
      }
      if (
        jsonObject.dateOfBirth &&
        relatedData &&
        moment(jsonObject.dateOfBirth, 'DDMMYYYY').format('YYYY-MM-DD') != moment(relatedData.birthDate).format('YYYY-MM-DD')
      ) {
        stateChanged = true
        changedData.dob = moment(jsonObject.dateOfBirth, 'DDMMYYYY').format('YYYY-MM-DD');
        uamInstance.dob = moment(jsonObject.dateOfBirth, 'DDMMYYYY');
        uamInstance.newDob = uamInstance.dob;
        uamInstance.oldDob = relatedData.birthDate;
      } else {
        uamInstance.oldDob = null;
        uamInstance.newDob = null;
        uamInstance.dob = relatedData ? relatedData.birthDate : uamInstance.dob;
        appUserInstance.dob = relatedData ? relatedData.birthDate : appUserInstance.dob;
      }
      if (jsonObject.category && jsonObject.category !== relatedData.category) {
        stateChanged = true
        changedData.category = jsonObject.category;
        uamInstance.oldCategory = relatedData.category;
        uamInstance.newCategory = jsonObject.category;
      } else {
        uamInstance.oldCategory = null;
        uamInstance.newCategory = null;
        appUserInstance.category = relatedData.category;
      }
      // if (jsonObject.userType && jsonObject.userType != appUserInstance.operationDetails.userType) {
      //   uamInstance.oldUserType = appUserInstance.userType;
      //   uamInstance.newUserType = jsonObject.userType;
      //   changedData.userType = jsonObject.userType;
      // } else {
      //   uamInstance.oldUserType = null;
      //   uamInstance.newUserType = null;
      //   uamInstance.userType = appUserInstance.operationDetails.userType;
      // }

      if (jsonObject.contactNumber && jsonObject.contactNumber !== UAMData.contactNumber) {
        stateChanged= true
        uamInstance.oldContactNumber = UAMData.contactNumber;
        uamInstance.newContactNumber = jsonObject.contactNumber;
        uamInstance.contactNumber = jsonObject.contactNumber;
        changedData.contactNumber = jsonObject.contactNumber;
      } else {
        uamInstance.oldContactNumber = null;
        uamInstance.newContactNumber = null;
        uamInstance.contactNumber = UAMData.contactNumber;
      }

      if (jsonObject.branchCode && jsonObject.branchCode !== uamInstance.branchCode) {
        stateChanged = true
        uamInstance.oldBranchCode = uamInstance.branchCode;
        uamInstance.newBranchCode = jsonObject.branchCode;
        uamInstance.branchCode = jsonObject.branchCode;
        changedData.branchCode = jsonObject.branchCode;
      } else {
        uamInstance.oldBranchCode = null;
        uamInstance.newBranchCode = null;
        // uamInstance.branchCode = appUserInstance.salutation;
      }
      if (jsonObject.branchName && jsonObject.branchName !== uamInstance.branchName) {
        uamInstance.oldBranchName = uamInstance.branchName;
        uamInstance.newBranchName = jsonObject.branchName;
        uamInstance.branchName = jsonObject.branchName;
        changedData.branchName = jsonObject.branchName;
      } else {
        uamInstance.oldBranchName = null;
        uamInstance.newBranchName = null;
        // uamInstance.branchName = appUserInstance.salutation;
      }
      if (jsonObject.departmentCode && jsonObject.departmentCode !== uamInstance.departmentCode) {
        stateChanged = true
        uamInstance.oldDepartmentCode = uamInstance.departmentCode;
        uamInstance.newDepartmentCode = jsonObject.departmentCode;
        uamInstance.departmentCode = jsonObject.departmentCode;
        changedData.departmentCode = jsonObject.departmentCode;
      } else {
        uamInstance.oldDepartmentCode = null;
        uamInstance.newDepartmentCode = null;
        // uamInstance.branchName = appUserInstance.salutation;
      }
      if (jsonObject.departmentName && jsonObject.departmentName !== uamInstance.departmentName) {
        stateChanged = true
        uamInstance.oldDepartmentName = uamInstance.departmentName;
        uamInstance.newDepartmentName = jsonObject.departmentName;
        uamInstance.departmentName = jsonObject.departmentName;
        changedData.departmentName = jsonObject.departmentName;
      } else {
        uamInstance.oldDepartmentName = null;
        uamInstance.newDepartmentName = null;
        // uamInstance.branchName = appUserInstance.salutation;
      }
      if (jsonObject.employeeCode && jsonObject.employeeCode !== uamInstance.employeeCode) {
        stateChanged = true
        uamInstance.employeeCode = jsonObject.employeeCode;
        appUserInstance.employeeCode = jsonObject.employeeCode;
      } else {
        uamInstance.employeeCode = UAMData.employeeCode;
        appUserInstance.employeeCode = UAMData.employeeCode;
      }
      //if no parameter changes we respond with this
      // if(!stateChanged) return this.xmlResponse({message: `REQUEST REJECTED BECAUSE NO CHANGE IN TEMPLATE`, statusCode: 26, uniqueNumber: jsonObject.uniqueNumber});

      uamInstance.isActive = true;
      (uamInstance.lastModifiedMakerId = 'ISACMAK'),
        (uamInstance.lastModifiedCheckerId = 'SYSTEM'),
        (appUserInstance.changedData = changedData);
      await this.updateActiveUserDetails(appUserInstance.id, appUserInstance);
      const updatedUser = await this.appUserRepository.findById(appUserInstance.id);
      appUserInstance = updatedUser;
      if (changedData) {
        appUserInstance.name = changedData.name ? changedData.name : appUserInstance.name;
        appUserInstance.email = changedData.email ? changedData.email : appUserInstance.email;
        appUserInstance.contactNumber = null;
        appUserInstance.salutation = changedData.salutation ? changedData.salutation : appUserInstance.salutation;
        appUserInstance.gender = changedData.gender ? changedData.gender : appUserInstance.gender;
      }
      appUserInstance.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS['active'].value;
      appUserInstance.isActive = true;
      appUserInstance.lastModifiedDate = new Date();
      const createAppUser = await this.appUserRepository.updateAll(appUserInstance, {id: appUserInstance.id});
      if (!createAppUser) {
        throw new Error('Error while creating User');
      }
      oldUAMData.isLatest = false;

      const createOldUAMData = await this.uamIntegrationRepository.updateAll(oldUAMData, {id: oldUAMData.id});
      if (!createOldUAMData) {
        throw new Error('Error while creating Old UAM DATA');
      }
      const createUAMIntegration = await this.create(uamInstance);
      if (!createUAMIntegration) {
        throw new Error('Error while creating UAM DATA');
      }
      const UamLogs: UamIntegrationLogsFields = {
        userCode: createUAMIntegration.userCode,
        status: createUAMIntegration.status,
        activity: createUAMIntegration.activity,
        lastModifiedMakerId: createUAMIntegration.lastModifiedMakerId,
        lastModifiedCheckerId: createUAMIntegration.lastModifiedCheckerId
      };
      LoggingUtils.info(UamLogs, 'User modified');
      return this.xmlResponse({message: 'success', statusCode: 0, uniqueNumber: jsonObject.uniqueNumber});
    } catch (err) {
      return this.xmlResponse({message: 'Failure', statusCode: 1, err});
    }
  }

  async fetchUserIdPopulationReport(
    searchFilter: any = {},
    offset: number = 0,
    limit: number = MAX_DATA_FETCH_LIMIT,
    orderBy: Array<any> = []
  ): Promise<any> {
    if (limit > MAX_DATA_FETCH_LIMIT) {
      limit = MAX_DATA_FETCH_LIMIT;
    }
    return new Promise((resolve, reject) => {
      if (!Array.isArray(orderBy) || orderBy.length === 0) {
        orderBy = [{lastModifiedDate: 'DESC'}];
      }

      let orderByArr: any[] = [];
      _.each(orderBy, o => {
        const orderByKey = Object.keys(o)[0];
        orderByArr.push(`${orderByKey} ${o[orderByKey].toUpperCase()}`);
      });

      let sql = `select "id" from "uam_integration" where 1=1 and "is_latest" = true `;

      if (searchFilter) {
        for (let key in searchFilter) {
          if (
            key &&
            searchFilter[key] !== null &&
            searchFilter[key] !== undefined &&
            searchFilter[key] != '' &&
            searchFilter[key].length >= MIN_SEARCH_CHAR_LIMIT
          ) {
            const col = key
              .replace(/\.?([A-Z]+)/g, function (x, y) {
                return '_' + y.toLowerCase();
              })
              .replace(/^_/, '');
            sql += `and (case when '${searchFilter[key]}' is null then 1 when UPPER("${col}") like '%${searchFilter[key]
              .toUpperCase()
              .replaceAll(' ', '%')}%' then 1 end = 1) `;
          }
        }
      }

      // if (fromDate && toDate) {
      //   sql += `and date_trunc("created_date") between TO_DATE('${moment(fromDate).format('DD-MM-YYYY')}', 'DD-MM-YYYY') and TO_DATE('${moment(
      //     toDate
      //   ).format('DD-MM-YYYY')}', 'DD-MM-YYYY') `;
      // }
      let total = 0;
      return this.uamIntegrationRepository
        .execute(sql)
        .then(activities => {
          total = activities.length;
          let query: any = {
            where: {
              id: {inq: _.pluck(activities, 'id')}
            },
            include: [
              {
                relation: 'appUser',
                scope: {
                  include: [
                    {
                      relation: 'operationDetails'
                    },
                    {
                      relation: 'appRoles'
                    }
                  ]
                }
              }
            ],
            order: orderByArr.join(',')
          };
          if (limit > 0) {
            query.limit = limit;
            query.offset = offset;
          }
          return this.uamIntegrationRepository.find(query);
        })
        .then((activityData: any) => {
          _.each(activityData, activity => {
            let relatedData = null;
            if (
              activity.appUser &&
              activity.appUser.appRoles &&
              activity.appUser.appRoles &&
              activity.appUser.appRoles.length &&
              activity.appUser.operationDetails
            ) {
              if (activity.appUser.userType == Option.GLOBALOPTIONS.USERTYPE['general'].value) {
                relatedData = activity.appUser.operationDetails;
              }
            }
            if (activity.appUser && activity.appUser) {
              activity.lastLoginDate = activity.appUser.lastLoginDate;
              // activity.expiryDate = activity.appUser().accountExpiry;
              activity.email = activity.appUser.email;
              activity.userCode = activity.appUser.userCode;
              activity.userName = activity.appUser.name;
              activity.creationDate = activity.creationDateTime;
              activity.appUserStatusLabel = activity.appUser.appUserStatusLabel;
              activity.category = relatedData ? relatedData.categoryLabel : null;
            }
          });
          return resolve({data: activityData, total: total});
        })
        .catch((err: any) => {
          return reject(err);
        });
    });
  }

  async exportUserIdPopulationReport(
    exportFormat: string,
    res: Response,
    fromDate: Date | string | undefined,
    toDate: Date | string | undefined,
    searchFilter: any = {},
    // limit: number,
    // offset: number = 0,
    orderBy: Array<any> = [{lastModifiedDate: 'DESC'}]
  ) {
    return new Promise((resolve, reject) => {
      if (exportFormat !== 'xlsx') {
        return reject(new RestError(400, `export format should be xlsx!`, {systemcode: 1334}));
      }
      let headers = [
        {header: 'Login ID', key: 'userCode', width: 50},
        {header: 'User Name', key: 'userName', width: 32},
        {header: 'Employee Code', key: 'employeeCode', width: 32},
        {header: 'Branch Code', key: 'branchCode', width: 32},
        {header: 'Branch Name', key: 'branchName', width: 32},
        {header: 'Department Code', key: 'departmentCode', width: 32},
        {header: 'Department Name', key: 'departmentName', width: 32},
        {header: 'Profile 1', key: 'profile', width: 32},
        // {header: 'Email', key: 'email', width: 32},
        // {header: 'Profile 2', key: 'subProfile', width: 32},
        {header: 'Status 1', key: 'appUserStatusLabel', width: 32},
        // {header: 'Status 2', key: 'subStatus', width: 32},
        {header: 'Creation Date', key: 'creationDateTime', width: 32},
        {header: 'Last Password Changed Date', key: '', width: 32},
        {header: 'Last Login Date', key: 'userLastLoginDate', width: 32},
        {header: 'Maker ID', key: 'lastModifiedMakerId', width: 32},
        {header: 'Maker Date & Time', key: 'makerLastModifiedDateTime', width: 32},
        {header: 'Checker ID', key: 'lastModifiedCheckerId', width: 32},
        {header: 'Checker Date & Time', key: 'checkerLastModifiedDateTime', width: 32},
        {header: 'Profile End Date', key: 'deletionDateTime', width: 32},
        // {header: 'Category', key: 'category', width: 32},
        {header: 'Disabling Date', key: 'disableDateTime', width: 32}
        // {header: 'Dormant Date', key: 'dormantDate', width: 32}
      ];

      this.fetchUserIdPopulationReport(searchFilter, 0, -1, orderBy)
        .then(async activityData => {
          let reportData: any = [];
          _.each(activityData.data, function (userIdPopulation, index) {
            reportData.push({
              userCode: userIdPopulation.userCode.toUpperCase(),
              userName: userIdPopulation.userName,
              employeeCode: userIdPopulation.employeeCode.toUpperCase(),
              branchCode: userIdPopulation.branchCode,
              branchName: userIdPopulation.branchName,
              departmentCode: userIdPopulation.departmentCode,
              departmentName: userIdPopulation.departmentName,
              profile: userIdPopulation.profile,
              email: userIdPopulation.email,
              subProfile: userIdPopulation.subProfile,
              appUserStatusLabel: userIdPopulation.appUserStatusLabel,
              subStatus: userIdPopulation.subStatus,
              lastModifiedMakerId: userIdPopulation.lastModifiedMakerId,
              lastModifiedCheckerId: userIdPopulation.lastModifiedCheckerId,
              category: userIdPopulation.categoryLabel,
              makerLastModifiedDateTime: moment(userIdPopulation.lastModifiedMakerDateTime, 'YYYY-MM-DD HH:mm:ss').format(
                'DD-MMM-YYYY HH:mm:ss'
              ),
              checkerLastModifiedDateTime: null,
              expiryDate: userIdPopulation.expiryDate
                ? moment(userIdPopulation.expiryDate, 'YYYY-MM-DD HH:mm:ss').format('DD-MMM-YYYY HH:mm:ss')
                : null,
              creationDateTime: userIdPopulation.creationDateTime
                ? moment(userIdPopulation.creationDateTime, 'YYYY-MM-DD HH:mm:ss').format('DD-MMM-YYYY HH:mm:ss')
                : null,
              dormantDate: userIdPopulation.dormantDateTime
                ? moment(userIdPopulation.dormantDateTime, 'YYYY-MM-DD HH:mm:ss').format('DD-MMM-YYYY HH:mm:ss')
                : null,
              disableDateTime: userIdPopulation.disableDateTime
                ? moment(userIdPopulation.disableDateTime, 'YYYY-MM-DD HH:mm:ss').format('DD-MMM-YYYY HH:mm:ss')
                : null,
              deletionDateTime: userIdPopulation.deletionDateTime
                ? moment(userIdPopulation.deletionDateTime, 'YYYY-MM-DD HH:mm:ss').format('DD-MMM-YYYY HH:mm:ss')
                : null,
              userLastLoginDate: userIdPopulation.lastLoginDate
                ? moment(userIdPopulation.lastLoginDate, 'YYYY-MM-DD HH:mm:ss').format('DD-MMM-YYYY HH:mm:ss')
                : null
            });
          });

          res.append('fileName', 'UserIdPopulation.xlsx');
          let excelSheet = ExcelUtils.createExcel(null, 'UserIdPopulation', headers, reportData, null);
          const result = await excelSheet.xlsx.writeBuffer();
          return resolve(result);
        })
        .catch(err => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  async updateActiveUserDetails(appUserId: number, details: any) {
    return new Promise((resolve, reject) => {
      let userType: number, updatedUserType: number, appUserRoleMappingData: any, updatedRoleId: number;
      updatedRoleId =
        details.changedData && details.changedData.appRole
          ? details.changedData.appRole.id
          : details.changedData.appRoleId
          ? details.changedData.appRoleId
          : details.appRole.id;

      if (!updatedRoleId) {
        return reject(new RestError(400, `App Role ID Required!`, {systemcode: 1335}));
      }

      this.appUserRoleMappingRepository
        .findOne({
          where: {
            appUserId: appUserId
          },
          include: [
            {
              relation: 'appUser',
              scope: {
                include: [
                  {
                    relation: 'investorDetails'
                  },
                  {
                    relation: 'operationDetails'
                  }
                ]
              }
            },
            {
              relation: 'appRole'
            }
          ]
        })
        .then(mapping => {
          appUserRoleMappingData = mapping;
          if (!mapping) {
            return Promise.reject(new RestError(400, `Role not found!`, {systemcode: 1336}));
          }
          userType = appUserRoleMappingData?.appUser?.operationDetails?.userType;
          return this.appRoleRepository.findById(updatedRoleId);
        })
        .then(async appRoleInstance => {
          if (!appRoleInstance) {
            return Promise.reject(new RestError(400, `Role not found!`, {systemcode: 1336}));
          }
          updatedUserType = details.changedData && details.changedData.userType ? details.changedData.userType : userType;
          let promiseP1 = Promise.resolve();
          if (updatedRoleId != appUserRoleMappingData.appRole.id) {
            const appRoleMappingInstance = await this.appUserRoleMappingRepository.findOne({
              where: {
                appUserId: appUserId
              }
            });
            if (!appRoleMappingInstance) {
              return Promise.reject(new RestError(400, `App Role Mapping does not Exist!`, {systemcode: 1337}));
            }
            if (appRoleMappingInstance.appRoleId != updatedRoleId) {
              appRoleMappingInstance.appRoleId = updatedRoleId;
              return this.appUserRoleMappingRepository.updateAll(appRoleMappingInstance, {appUserId: appUserId});
            }
            return Promise.resolve();
          }
        })
        .then(() => {
          let promises = [];
          if (updatedUserType == Option.GLOBALOPTIONS.USERTYPE['general'].value) {
            if (userType == Option.GLOBALOPTIONS.USERTYPE['general'].value) {
              promises.push(this.saveExistingNonRMUserDetails(true, appUserId, details, updatedRoleId));
            }
          }
          return Promise.all(promises);
        })
        .then(() => {
          return resolve({success: true});
        })
        .catch((err: any) => {
          LoggingUtils.error(err);
          reject(err);
        });
    });
  }

  saveExistingNonRMUserDetails(isExisted: boolean, appUserId: number, details: any, appRoleId: number) {
    return new Promise((resolve, reject) => {
      if (!details) {
        return reject(new RestError(400, `Details is required!`, {systemcode: 1329}));
      }

      if (!details.userCode) {
        return reject(new RestError(400, `User Code is Required!`, {systemcode: 1317}));
      }

      let innerPromise;
      if (isExisted) {
        let mapping;
        innerPromise = this.appUserRoleMappingRepository
          .findOne({
            where: {
              appUserId: appUserId,
              appRoleId: appRoleId
            },
            include: [
              {
                relation: 'appUser',
                scope: {
                  include: [
                    {
                      relation: 'operationDetails'
                    },
                    {
                      relation: 'investorDetails'
                    }
                  ]
                }
              }
            ]
          })
          .then(async data => {
            if (!data) {
              return Promise.reject(new RestError(400, `Mapping not found!`, {systemcode: 1338}));
            }
            mapping = data;
            for (let column in details.changedData) {
              if (column != 'appUserStatus') {
                mapping.appUser[column] = details.changedData[column];
              }
            }
            // if (details.accountExpiry && new Date(details.accountExpiry)) {
            //   mapping.appUser.accountExpiry = new Date(details.accountExpiry);
            // }
            if (details.changedData.category) {
              mapping.appUser.operationDetails.category = details.changedData.category;
            }
            if (details.changedData.dob) {
              mapping.appUser.operationDetails.birthDate = new Date(details.changedData.dob);
            }
            if (details.changedData.employeeCode) {
              mapping.appUser.operationDetails.employeeCode = details.changedData.employeeCode;
            }
            const operationData = await this.operationRepository.updateAll(mapping.appUser.operationDetails, {
              id: mapping.appUser.operationDetails.id
            });
            const userData = await this.appUserRepository.updateAll(mapping.appUser, {id: mapping.appUser.id});
            return Promise.all([operationData, userData]);
          });
      } else {
        let mapping;
        innerPromise = this.appUserRoleMappingRepository
          .findOne({
            where: {
              appUserId: appUserId,
              appRoleId: appRoleId
            },
            include: [
              {
                relation: 'appUser'
              }
            ]
          })
          .then(async data => {
            if (!data) {
              return Promise.reject(new RestError(400, `Mapping not found!`, {systemcode: 1338}));
            }
            mapping = data;
            for (let column in details.changedData) {
              if (column != 'appUserStatus') {
                mapping.appUser[column] = details.changedData[column];
              }
            }
            // if (details.accountExpiry && new Date(details.accountExpiry)) {
            //   mapping.appUser.accountExpiry = new Date(details.accountExpiry);
            // }
            return await this.appUserRepository.updateAll(mapping.appUser, {id: mapping.appUser.id});
          })
          .then(() => {
            return this.operationRepository.create({
              appUserId: appUserId,
              category: details.changedData.category ? details.changedData.category : details.category,
              // birthDate: details.changedData.dob ? new Date(details.changedData.dob) : (details.dob ? new Date(details.dob) : null),
              employeeCode: details.changedData.employeeCode ? details.changedData.employeeCode : details.employeeCode
            });
          })
          .then(() => {
            return Promise.resolve();
          });
      }

      innerPromise.then(resolve).catch(reject);
    });
  }

  async changeAppUserStatus(details: any, uniqueNumber: string, userProfile: {appUserId: number}) {
    try {

      let userEnabledFromDormancy = false
      if (!(details && details.userCode && details.appUserStatusValue)) {
        await this.createUamLog({message: 'Please provide valid info!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'Please provide valid info!', {systemcode: 1020}));
      }

      //get the maker id
      if (!userProfile.appUserId) {
        return await Promise.reject(new RestError(465, `Couldn't identify maker`, {systemcode: 1339}));
      }

      const makerId = await this.appUserRepository.findOne({
        fields: {userCode: true},
        where: {
          isActive: true,
          id: userProfile.appUserId
        }
      });
      if (!makerId || !makerId.userCode) {
        return await Promise.reject(new RestError(465, `Couldn't identify maker`, {systemcode: 1339}));
      }
      let appUserInstance: any = {},
        activity: string = '',
        isLatest: boolean = true,
        isActive: boolean = true,
        statusLabel: string = '',
        disableDateTime: any = null,
        deletionDateTime: any = null,
        roleInstance: any = {},
        uamInstance: any = {},
        oldUAMData: any = {},
        changedData: any = {};

      let rawResult, foundRole;
      if (details.appRoleId) {
        rawResult = await this.appRoleRepository.find({
          where: {
            id: details.appRoleId,
            isActive: true
          }
        });
        if (rawResult) {
          // if role change request, check if exists
          if (!rawResult.length) {
            await this.createUamLog({message: 'ROLE ID DOES NOT EXITS!', uniqueNumber: uniqueNumber});
            return await Promise.reject(new RestError(400, 'ROLE ID DOES NOT EXITS!', {systemcode: 1340}));
          }

          foundRole = await this.appRoleRepository.findOne({
            where: {
              id: rawResult[0]['id'],
              isActive: true
            }
          });
        }
        if (!foundRole) {
          await this.createUamLog({message: 'INVALID ROLE ID!', uniqueNumber: uniqueNumber});
          return await Promise.reject(new RestError(400, 'INVALID ROLE ID!', {systemcode: 1341}));
        }
      }
      roleInstance = foundRole;
      let upperCaseUserCode = details.userCode.toUpperCase();
      const appUser = await this.appUserRepository.findOne({
        where: {
          userCode: upperCaseUserCode
        },
        include: [
          {
            relation: 'appRoles'
          },
          {
            relation: 'operationDetails'
          }
        ]
      });

      if (!appUser) {
        await this.createUamLog({message: 'USERID DOES NOT EXISTS!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'USERID DOES NOT EXISTS!', {systemcode: 1342}));
      }
      appUserInstance = appUser;
      if (details.appUserStatusValue === Option.GLOBALOPTIONS.APPUSERSTATUS.disabled.value) {
        //disable
        if (appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.disabled.value) {
          await this.createUamLog({message: 'USERID ALREADY DISABLED!', uniqueNumber: uniqueNumber});
          return await Promise.reject(new RestError(400, 'USERID ALREADY DISABLED!', {systemcode: 1343}));
        }
        if (appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.value) {
          await this.createUamLog({message: 'USERID IS DELETED CANNOT BE MODIFIED!', uniqueNumber: uniqueNumber});
          return await Promise.reject(new RestError(400, 'USERID IS DELETED CANNOT BE MODIFIED!', {systemcode: 1344}));
        }
        if (
          !(
            appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS['dormant'].value ||
            appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS['active'].value ||
            appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS['locked'].value
          )
        ) {
          return await Promise.reject(new RestError(400, 'USERID CAN ONLY BE EITHER ENABLED OR DELETED!', {systemcode: 1345}));
        }
        appUserInstance.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS['disabled'].value;
        appUserInstance.isActive = false;
        activity = 'DISABLE';
        isLatest = true;
        isActive = false;
        statusLabel = Option.GLOBALOPTIONS.APPUSERSTATUS.disabled.label;
        disableDateTime = new Date();
        await this.appAccessTokenRepository.updateAll({isActive: false}, {isActive: true, appUserId: appUser.id});
      }
      if (details.appUserStatusValue === Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.value) {
        //delete
        if (appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.value) {
          await this.createUamLog({message: 'USERID ALREADY DELETED!', uniqueNumber: uniqueNumber});
          return await Promise.reject(new RestError(400, 'USERID ALREADY DELETED!', {systemcode: 1346}));
        }
        if (
          !(
            appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS['dormant'].value ||
            appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS['locked'].value ||
            appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS['disabled'].value ||
            appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS['active'].value
          )
        ) {
          return await Promise.reject(new RestError(400, "USERID CAN'T BE DELETED!", {systemcode: 1347}));
        }
        appUserInstance.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS['deleted'].value;
        appUserInstance.isActive = false;
        deletionDateTime = new Date();
        activity = 'DELETE';
        statusLabel = Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.label;
        isLatest = true;
        isActive = false;
        await this.appAccessTokenRepository.updateAll({isActive: false}, {isActive: true, appUserId: appUser.id});
      }
      if (details.appUserStatusValue === Option.GLOBALOPTIONS.APPUSERSTATUS.locked.value) {
        //lock
        if (appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.value) {
          await this.createUamLog({message: 'USERID ALREADY DELETED!', uniqueNumber: uniqueNumber});
          return await Promise.reject(new RestError(400, 'USERID ALREADY DELETED!', {systemcode: 1346}));
        }
        if (appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.disabled.value) {
          await this.createUamLog({message: 'USERID ALREADY DISABLED!', uniqueNumber: uniqueNumber});
          return await Promise.reject(new RestError(400, 'USERID ALREADY DISABLED!', {systemcode: 1343}));
        }
        if (appUserInstance.appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.locked.value) {
          await this.createUamLog({message: 'USERID ALREADY LOCKED!', uniqueNumber: uniqueNumber});
          return await Promise.reject(new RestError(400, 'USERID ALREADY LOCKED!', {systemcode: 1348}));
        }
        appUserInstance.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS['locked'].value;
        appUserInstance.isActive = false;
        activity = 'LOCK';
        statusLabel = Option.GLOBALOPTIONS.APPUSERSTATUS.locked.label;
        isLatest = true;
        isActive = false;
      }
      if (details.appUserStatusValue === Option.GLOBALOPTIONS.APPUSERSTATUS.active.value) {
        //update
        // if (appUserInstance.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.value) {
        //   await this.createUamLog({message: 'USERID IS DELETED CANNOT BE MODIFIED!', uniqueNumber: uniqueNumber});
        //   return await Promise.reject(new RestError(400, 'USERID IS DELETED CANNOT BE MODIFIED!'));
        // }

        // if (appUserInstance.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.locked.value) {
        //   await this.createUamLog({message: 'USERID IS LOCKED CANNOT BE MODIFIED!', uniqueNumber: uniqueNumber});
        //   return await Promise.reject(new RestError(400, 'USERID IS LOCKED CANNOT BE MODIFIED!'));
        // }
        // if (appUserInstance.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.blocked.value) {
        //   await this.createUamLog({message: 'USERID IS DISABLED CANNOT BE MODIFIED!', uniqueNumber: uniqueNumber});
        //   return await Promise.reject(new RestError(400, 'USERID IS DISABLED CANNOT BE MODIFIED!'));
        // }
        // if (appUser.appUserStatus == Option.GLOBALOPTIONS.APPUSERSTATUS.suspended.value) {
        //   await this.createUamLog({message: 'USERID IS DORMANT CANNOT BE MODIFIED!', uniqueNumber: uniqueNumber});
        //   return await Promise.reject(new RestError(400, 'USERID IS DORMANT CANNOT BE MODIFIED!'));
        // }

        const UAMData = await this.uamIntegrationRepository.findOne({
          where: {
            userCode: upperCaseUserCode,
            isLatest: true
          }
        });
        if (!UAMData) {
          await this.createUamLog({message: 'UAM USERID DOES NOT EXISTS!', uniqueNumber: uniqueNumber});
          return await Promise.reject(new RestError(400, 'UAM USERID DOES NOT EXISTS!', {systemcode: 1349}));
        }
        uamInstance = UAMData ? UAMData.toJSON() : {};
        uamInstance.lastModifiedMakerId = makerId.userCode;
        uamInstance.lastModifiedCheckerId = makerId.userCode;
        oldUAMData = UAMData;
        if (UAMData.status === Option.GLOBALOPTIONS.APPUSERSTATUS.locked.label) activity = 'UNLOCK';
        else if (UAMData.status === Option.GLOBALOPTIONS.APPUSERSTATUS.disabled.label) activity = 'ENABLE';
        else if (UAMData.status === Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.label) activity = 'REOPEN';
        else if (UAMData.status === Option.GLOBALOPTIONS.APPUSERSTATUS.dormant.label) {
          activity = 'ENABLE';
          userEnabledFromDormancy = true
        }
        else if (activity == '') activity = 'MODIFY';
        delete uamInstance.id;
        isLatest = true;
        uamInstance.isLatest = isLatest;
        uamInstance.userCode = upperCaseUserCode;
        uamInstance.employeeCode = details.employeeCode && details.employeeCode != '' ? details.employeeCode : uamInstance.employeeCode;
        uamInstance.activity = activity;
        uamInstance.disableDateTime = null;
        uamInstance.dormantDateTime = null;
        uamInstance.deletionDateTime = null;

        details.lastLoginDate = appUserInstance.lastLoginDate;
        details.appUserStatus = appUserInstance.appUserStatus;

        if (details.name && details.name !== appUserInstance.name) {
          uamInstance.oldEmployeeName = appUserInstance.name;
          uamInstance.newEmployeeName = details.name;
          changedData.name = details.name;
          uamInstance.userName = details.name;
        } else {
          uamInstance.userName = appUserInstance.name;
          uamInstance.oldEmployeeName = null;
          uamInstance.newEmployeeName = null;
        }

        if (details.email && details.email !== appUserInstance.email) {
          changedData.email = details.email;
          uamInstance.oldEmail = appUserInstance.email;
          uamInstance.newEmail = details.email;
          uamInstance.email = details.email;
        } else {
          uamInstance.oldEmail = null;
          uamInstance.newEmail = null;
          uamInstance.email = appUserInstance.email;
        }
        if (details.gender && details.gender !== appUserInstance.gender) {
          changedData.gender = details.gender;
          uamInstance.oldGender = appUserInstance.gender;
          uamInstance.newGender = details.gender;
          uamInstance.gender = details.gender;
        } else {
          uamInstance.oldGender = null;
          uamInstance.newGender = null;
          uamInstance.gender = appUserInstance.gender;
        }

        if (details.appRoleId && details.appRoleId !== appUserInstance.appRoles[0].id) {
          uamInstance.oldProfileName = appUserInstance.appRoles[0].name;
          uamInstance.newProfileName = roleInstance.name;
          uamInstance.profile = roleInstance.name;
          changedData.appRole = roleInstance;
        } else {
          changedData.appRoleId = appUserInstance.appRoles[0].id; // required to send roleID
          uamInstance.oldProfileName = null;
          uamInstance.newProfileName = null;
          uamInstance.profile = appUserInstance.appRoles[0].name;
        }

        if (details.salutation && details.salutation != appUserInstance.salutation) {
          uamInstance.oldSalutation = appUserInstance.salutation;
          uamInstance.newSalutation = details.salutation;
          uamInstance.salutation = details.salutation;
          changedData.salutation = details.salutation;
        } else {
          uamInstance.oldSalutation = null;
          uamInstance.newSalutation = null;
          uamInstance.salutation = appUserInstance.salutation;
        }
        if (details.branchCode && details.branchCode !== uamInstance.branchCode) {
          uamInstance.oldBranchCode = uamInstance.branchCode;
          uamInstance.newBranchCode = details.branchCode;
          uamInstance.branchCode = details.branchCode;
          changedData.branchCode = details.branchCode;
        } else {
          uamInstance.oldBranchCode = null;
          uamInstance.newBranchCode = null;
          // uamInstance.branchCode = appUserInstance.salutation;
        }
        if (details.branchName && details.branchName !== uamInstance.branchName) {
          uamInstance.oldBranchName = uamInstance.branchName;
          uamInstance.newBranchName = details.branchName;
          uamInstance.branchName = details.branchName;
          changedData.branchName = details.branchName;
        } else {
          uamInstance.oldBranchName = null;
          uamInstance.newBranchName = null;
          // uamInstance.branchName = appUserInstance.salutation;
        }
        if (details.departmentCode && details.departmentCode !== uamInstance.departmentCode) {
          uamInstance.oldDepartmentCode = uamInstance.departmentCode;
          uamInstance.newDepartmentCode = details.departmentCode;
          uamInstance.departmentCode = details.departmentCode;
          changedData.departmentCode = details.departmentCode;
        } else {
          uamInstance.oldDepartmentCode = null;
          uamInstance.newDepartmentCode = null;
          // uamInstance.branchName = appUserInstance.salutation;
        }
        if (details.departmentName && details.departmentName !== uamInstance.departmentName) {
          uamInstance.oldDepartmentName = uamInstance.departmentName;
          uamInstance.newDepartmentName = details.departmentName;
          uamInstance.departmentName = details.departmentName;
          changedData.departmentName = details.departmentName;
        } else {
          uamInstance.oldDepartmentName = null;
          uamInstance.newDepartmentName = null;
          // uamInstance.branchName = appUserInstance.salutation;
        }
        if (details.employeeCode && details.employeeCode !== uamInstance.employeeCode) {
          uamInstance.employeeCode = details.employeeCode;
        }
        let relatedData;
        if (appUserInstance.operationDetails.userType == Option.GLOBALOPTIONS.USERTYPE['general'].value) {
          relatedData = appUserInstance.operationDetails;
        }
        if (
          details.dob &&
          relatedData &&
          moment(details.dob, 'DDMMYYYY').format('YYYY-MM-DD') != moment(relatedData.birthDate).format('YYYY-MM-DD')
        ) {
          changedData.dob = moment(details.dob, 'DDMMYYYY').format('YYYY-MM-DD');
          uamInstance.dob = moment(details.dob, 'DDMMYYYY').add(5, 'hours').add(30, 'minutes')
          uamInstance.newDob = uamInstance.dob;
          uamInstance.oldDob = moment(relatedData.birthDate).add(5, 'hours').add(30, 'minutes');
        } else {
          uamInstance.oldDob = null;
          uamInstance.newDob = null;
          if (details.dob === ""){
            uamInstance.dob = null;
            uamInstance.oldDob = moment(relatedData.birthDate).add(5, 'hours').add(30, 'minutes');
          }else{
            uamInstance.dob = relatedData ? moment(relatedData.birthDate).add(5, 'hours').add(30, 'minutes') : uamInstance.dob.add(5, 'hours').add(30, 'minutes');
          }
          appUserInstance.dob = relatedData ? relatedData.birthDate : appUserInstance.dob;
        }
        if (details.category && details.category !== relatedData.category) {
          changedData.category = details.category;
          uamInstance.oldCategory = relatedData.category;
          uamInstance.newCategory = details.category;
        } else {
          uamInstance.oldCategory = null;
          uamInstance.newCategory = null;
          appUserInstance.category = relatedData.category;
        }
        if (details.userType && details.userType != appUserInstance.operationDetails.userType) {
          uamInstance.oldUserType = appUserInstance.userType;
          uamInstance.newUserType = details.userType;
          changedData.userType = details.userType;
        } else {
          uamInstance.oldUserType = null;
          uamInstance.newUserType = null;
          uamInstance.userType = appUserInstance.operationDetails.userType;
        }

        if (details.contactNumber && details.contactNumber !== UAMData.contactNumber) {
          uamInstance.oldContactNumber = UAMData.contactNumber;
          uamInstance.newContactNumber = details.contactNumber;
          changedData.contactNumber = details.contactNumber;
        } else {
          uamInstance.oldContactNumber = null;
          uamInstance.newContactNumber = null;
          uamInstance.contactNumber = UAMData.contactNumber;
        }
        uamInstance.isActive = true;
        statusLabel = Option.GLOBALOPTIONS.APPUSERSTATUS.active.label;
        appUserInstance.status = statusLabel;
        uamInstance.status = statusLabel;
        // appUserInstance.employeeCode = appUserInstance.employeeCode.toUpperCase();
        appUserInstance.changedData = changedData;

        const updatedData = await this.updateActiveUserDetails(appUserInstance.id, appUserInstance);
        const updatedUser = await this.appUserRepository.findById(appUserInstance.id);
        appUserInstance = updatedUser;
        if (changedData) {
          appUserInstance.name = changedData.name ? changedData.name : appUserInstance.name;
          appUserInstance.email = changedData.email ? changedData.email : appUserInstance.email;
          appUserInstance.contactNumber = null;
          appUserInstance.salutation = changedData.salutation ? changedData.salutation : appUserInstance.salutation;
          appUserInstance.gender = changedData.gender ? changedData.gender : appUserInstance.gender;
        }
        appUserInstance.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS['active'].value;
        appUserInstance.isActive = true;
        appUserInstance.lastModifiedDate = new Date();
        if (activity == 'UNLOCK') appUserInstance.loginRetryCount = 0;
        const createAppUser = await this.appUserRepository.updateAll(appUserInstance, {id: appUserInstance.id});
        if (!createAppUser) {
          throw new Error('Error while creating User');
        }
        oldUAMData.isLatest = false;
        const createOldUAMData = await this.uamIntegrationRepository.updateAll(oldUAMData, {id: oldUAMData.id});
        if (!createOldUAMData) {
          throw new Error('Error while creating Old UAM DATA');
        }
        const createUAMIntegration = await this.create(uamInstance);
        if (!createUAMIntegration) {
          throw new Error('Error while creating UAM DATA');
        }
        const UamLogs: UamIntegrationLogsFields = {
          userCode: createUAMIntegration.userCode,
          status: createUAMIntegration.status,
          activity: createUAMIntegration.activity,
          lastModifiedMakerId: createUAMIntegration.lastModifiedMakerId,
          lastModifiedCheckerId: createUAMIntegration.lastModifiedCheckerId
        };
        LoggingUtils.info(UamLogs, 'User updated');
      } else {
        appUserInstance.previousStatus = appUserInstance.appUserStatus;
        appUserInstance.lastModifiedDate = new Date();
        if (activity == 'UNLOCK') appUserInstance.loginRetryCount = 0;
        const createAppUser = await this.appUserRepository.updateAll(appUserInstance, {id: appUserInstance.id});
        if (!createAppUser) {
          throw new Error('Error while creating User');
        }
        const uamLog = await this.uamIntegrationRepository.findOne({
          where: {
            userCode: upperCaseUserCode,
            isLatest: true
          }
        });
        if (uamLog) {
          let UAMData: any = uamLog.toJSON();
          // Use old record to create new record and mark this record as old
          uamLog.isLatest = false;
          delete UAMData.id;
          UAMData.isLatest = isLatest;
          UAMData.oldEmployeeName = null;
          UAMData.oldEmail = null;
          UAMData.oldDob = null;
          UAMData.oldSalutation = null;
          UAMData.oldCategory = null;
          UAMData.oldUserType = null;
          UAMData.oldContactNumber = null;
          UAMData.oldGender = null;
          UAMData.newEmployeeName = null;
          UAMData.newEmail = null;
          UAMData.newDob = null;
          UAMData.newSalutation = null;
          UAMData.newCategory = null;
          UAMData.newUserType = null;
          UAMData.newContactNumber = null;
          UAMData.newGender = null;
          UAMData.status = statusLabel;
          UAMData.lastLoginDate = appUserInstance.lastLoginDate;
          UAMData.activity = activity;
          UAMData.disableDateTime = disableDateTime;
          UAMData.deletionDateTime = deletionDateTime;
          UAMData.dormantDateTime = null;
          UAMData.isActive = isActive;
          UAMData.lastModifiedCheckerId = 'SYSTEM';
          UAMData.lastModifiedMakerId = makerId.userCode;
          UAMData.newProfileName = null;
          if(userEnabledFromDormancy) UAMData.enabledDormancyRecently = true // if the user is being enabled from dormancy we set this flag
          await this.uamIntegrationRepository.updateAll(uamLog, {id: uamLog.id});
          const updateUamIntegration = await this.create(UAMData);
          if (!updateUamIntegration) {
            throw new Error('Error while updating UAM Integration');
          }
          const UamLogs: UamIntegrationLogsFields = {
            userCode: updateUamIntegration.userCode,
            status: updateUamIntegration.status,
            activity: updateUamIntegration.activity,
            lastModifiedMakerId: updateUamIntegration.lastModifiedMakerId,
            lastModifiedCheckerId: updateUamIntegration.lastModifiedCheckerId
          };
          LoggingUtils.info(UamLogs, 'User updated');
        }
      }
      return Promise.resolve({success: true});
    } catch (err: any) {
      LoggingUtils.error(err);
      if (err instanceof RestError) {
        return Promise.reject(err);
      }
      return Promise.reject(new RestError(400, 'Something went wrong', {systemcode: 1244}));
    }
  }

  async createUser(details: any, uniqueNumber: string, userProfile: {appUserId: number}) {
    try {
      let appRoleInstance: any,
        appUserInstance: any = {};

      let emailParts: string = '';
      if (details.email) {
        emailParts = details.email.split('@');
      }
      if (
        !details.email ||
        !ValidationUtils.validateEmail(details.email) ||
        !(emailParts[1] && ['HDFCBANK.COM', 'IN.HDFCBANK.COM'].includes(emailParts[1].toUpperCase()))
      ) {
        await this.createUamLog({message: 'INVALID EMAILID!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'INVALID EMAILID!', {systemcode: 1350}));
      }
      if (!details.userCode) {
        await this.createUamLog({message: 'INVALID USER CODE!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'INVALID USER CODE!', {systemcode: 1351}));
      }

      if (!details.employeeCode || !/^[a-zA-Z0-9]{1,20}$/i.test(details.employeeCode)) {
        await this.createUamLog({message: 'INVALID EMPLOYEE CODE!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'INVALID EMPLOYEE CODE!', {systemcode: 1331}));
      }
      //@todo - maybe look at this later but for now set the user type to 2
      details['userType'] = 2;
      if (!details.userType || [Option.GLOBALOPTIONS.USERTYPE['general'].value].indexOf(Number(details.userType)) == -1) {
        await this.createUamLog({message: 'INVALID USER TYPE!!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'INVALID USER TYPE!', {systemcode: 1352}));
      }

      if (!details.category || categories.indexOf(Number(details.category)) == -1) {
        await this.createUamLog({message: 'INVALID CATEGORY!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'INVALID CATEGORY!', {systemcode: 1353}));
      }
      if (!details.name || !/^[a-zA-Z0-9' ]*$/.test(details.name)) {
        await this.createUamLog({message: 'INVALID USER NAME!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'INVALID USER NAME!', {systemcode: 1354}));
      }
      if (details.dob) {
        if (!moment(details.dob, 'DDMMYYYY').isValid()) {
          await this.createUamLog({message: 'INVALID DATE OF BIRTH!', uniqueNumber: uniqueNumber});
          return await Promise.reject(new RestError(400, 'INVALID DATE OF BIRTH!', {systemcode: 1332}));
        }
      }

      if (details.contactNumber) {
        if (!ValidationUtils.validateMobileNumber(details.contactNumber)) {
          await this.createUamLog({message: 'INVALID CONTACT NUMBER!', uniqueNumber: uniqueNumber});
          return await Promise.reject(new RestError(400, 'INVALID CONTACT NUMBER!', {systemcode: 1355}));
        }
      }
      else {
        details.contactNumber = null
      }

      if (details.salutation) {
        if (salutations.indexOf(Number(details.salutation)) == -1) {
          await this.createUamLog({message: 'INVALID SALUTATION!', uniqueNumber: uniqueNumber});
          return await Promise.reject(new RestError(400, 'INVALID SALUTATION!', {systemcode: 1356}));
        }
      }

      if (details.gender) {
        if (genders.indexOf(Number(details.gender)) == -1) {
          await this.createUamLog({message: 'INVALID GENDER!', uniqueNumber: uniqueNumber});
          return await Promise.reject(new RestError(400, 'INVALID GENDER!', {systemcode: 1357}));
        }
      }

      if (!details.branchCode || details.branchCode.length === 0) {
        await this.createUamLog({message: 'INVALID BRANCH CODE!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'INVALID BRANCH CODE!', {systemcode: 1358}));
      }
      if (!details.branchName || details.branchName.length === 0) {
        await this.createUamLog({message: 'INVALID BRANCH NAME!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'INVALID BRANCH NAME!', {systemcode: 1359}));
      }
      if (!details.departmentCode || details.departmentCode.length === 0) {
        await this.createUamLog({message: 'INVALID DEPARTMENT CODE!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'INVALID DEPARTMENT CODE!!', {systemcode: 1360}));
      }
      if (!details.departmentName || details.departmentCode.length === 0) {
        await this.createUamLog({message: 'INVALID DEPARTMENT NAME!!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'INVALID DEPARTMENT NAME!!', {systemcode: 1361}));
      }
      // if (!details.maxAllowedLoginAttempts || details.maxAllowedLoginAttempts < 1 || details.maxAllowedLoginAttempts > 5){
      //   await this.createUamLog({message: 'INVALID VALUE FOR MAX ALLOWED LOGIN ATTEMPTS!', uniqueNumber: uniqueNumber});
      //   return await Promise.reject(new RestError(400, 'INVALID VALUE FOR MAX ALLOWED LOGIN ATTEMPTS!'));
      // }

      details.userCode = details.userCode.toUpperCase();

      //get the maker id
      if (!userProfile.appUserId) {
        return await Promise.reject(new RestError(465, `Couldn't identify maker`, {systemcode: 1339}));
      }

      const makerId = await this.appUserRepository.findOne({
        fields: {userCode: true},
        where: {
          isActive: true,
          id: userProfile.appUserId
        }
      });
      if (!makerId || !makerId.userCode) {
        return await Promise.reject(new RestError(465, `Couldn't identify maker`, {systemcode: 1339}));
      }

      if (!details.appRoleId) {
        await this.createUamLog({message: 'INVALID ROLE ID!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'INVALID ROLE ID!', {systemcode: 1341}));
      }
      const rawResult = await this.appRoleRepository.find({
        where: {
          id: details.appRoleId,
          isActive: true
        }
      });

      if (!rawResult.length) {
        await this.createUamLog({message: 'INVALID ROLE ID!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'INVALID ROLE ID!', {systemcode: 1341}));
      }
      const foundRole = await this.appRoleRepository.findOne({
        where: {
          id: rawResult[0]['id'],
          isActive: true
        }
      });
      if (!foundRole) {
        await this.createUamLog({message: 'INVALID ROLE!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'INVALID ROLE!', {systemcode: 1362}));
      }
      appRoleInstance = foundRole;
      const rawAppUser = await this.appUserRepository.find({
        where: {
          userCode: details.userCode
          // isActive: true
        }
      });
      // Reject if existing non-ETL user
      if (
        rawAppUser &&
        rawAppUser.length > 0 &&
        rawAppUser[0]['appUserStatus'] != Option.GLOBALOPTIONS.APPUSERSTATUS['pendingRegistration'].value
      ) {
        await this.createUamLog({message: 'USERID/EMPCODE ALREADY EXISTS!', uniqueNumber: uniqueNumber});
        return await Promise.reject(new RestError(400, 'USERID/EMPCODE ALREADY EXISTS!', {systemcode: 1363}));
      }

      const maxPossibleLoginAttemots = await this.uamLoginAttemptsConfigRepository.findById(1);

      let dobToSave: any = details.dob ? moment.utc(details.dob, 'DDMMYYYY').format('YYYY-MM-DD') : null;
      const savedUser = await this.saveNonRMUserDetails(
        {
          currentAppUser: {id: null}
        },
        {
          name: details.name,
          email: ('' + details.email).trim(),
          dob: dobToSave,
          profile: appRoleInstance.name,
          userCode: details.userCode.toUpperCase(),
          activity: 'ADD',
          category: details.category,
          gender: details.gender ? details.gender : null,
          salutation: details.salutation ? details.salutation : null,
          contactNumber: details.contactNumber ? details.contactNumber : null,
          userType: details.userType,
          // maxAllowedLoginAttempts : maxPossibleLoginAttemots.maxLoginAttemots,
          appUserStatus: Option.GLOBALOPTIONS.APPUSERSTATUS['pendingRegistration'].value
        },
        appRoleInstance.id
      );
      if (!savedUser) {
        throw new Error('Error while creating non RM user');
      }
      const userData = await this.appUserRepository.findOne({
        where: {
          userCode: details.userCode.toUpperCase(),
          isActive: true
        },
        include: [
          {
            relation: 'operationDetails'
          },
          {
            relation: 'appRoles'
          }
        ],
        order: ['createdDate DESC']
      });
      appUserInstance = userData;
      appUserInstance.appUserStatus = Option.GLOBALOPTIONS.APPUSERSTATUS['active'].value;
      appUserInstance.isActive = true;
      const createAppUser = await this.appUserRepository.updateAll(appUserInstance, {id: appUserInstance.id});
      if (!createAppUser) {
        throw new Error('Error while creating User');
      }
      let relatedData: Partial<Operation> = {};
      if (appUserInstance.operationDetails && appUserInstance.operationDetails.userType == Option.GLOBALOPTIONS.USERTYPE['general'].value) {
        relatedData = appUserInstance.operationDetails;
      }
      const createUAMIntegration = await this.create({
        userCode: appUserInstance.userCode.toUpperCase(),
        userName: appUserInstance.name,
        newEmail: appUserInstance.email,
        email: appUserInstance.email,
        employeeCode: details.employeeCode,
        newEmployeeName: appUserInstance.name,
        dob: dobToSave == null || dobToSave == '' ? null : new Date(dobToSave),
        newDob: dobToSave == null || dobToSave == '' ? null : new Date(dobToSave),
        status: Option.GLOBALOPTIONS.APPUSERSTATUS['active'].label,
        appUserId: appUserInstance.id, // related appUser
        isLatest: true,
        profile: appRoleInstance.name,
        newProfileName: appRoleInstance.name,
        salutation: appUserInstance.salutation,
        newSalutation: appUserInstance.salutation,
        newCategory: relatedData && relatedData.category ? relatedData.category : null,
        activity: 'ADD',
        userType: appUserInstance.userType,
        newUserType: appUserInstance.userType,
        contactNumber: details.contactNumber,
        newContactNumber: appUserInstance.contactNumber,
        creationDateTime: new Date(),
        category: relatedData && relatedData.category ? relatedData.category : null,
        newGender: appUserInstance.gender ? appUserInstance.gender : null,
        gender: appUserInstance.gender ? appUserInstance.gender : null,
        lastModifiedMakerId: makerId.userCode,
        lastModifiedCheckerId: makerId.userCode,
        lastModifiedMakerDateTime: new Date(),
        lastModifiedCheckerDateTime: new Date(),
        branchCode: details.branchCode,
        branchName: details.branchName,
        departmentCode: details.departmentCode,
        departmentName: details.departmentName
        // maxAllowedLoginAttempts : relatedData.maxAllowedLoginAttempts
      });
      if (!createUAMIntegration) {
        throw new Error('Error while creating UAM Integration');
      }
      const UamLogs: UamIntegrationLogsFields = {
        userCode: createUAMIntegration.userCode,
        status: createUAMIntegration.status,
        activity: createUAMIntegration.activity,
        lastModifiedMakerId: createUAMIntegration.lastModifiedMakerId,
        lastModifiedCheckerId: createUAMIntegration.lastModifiedCheckerId
      };
      LoggingUtils.info(UamLogs, 'User created');
      return Promise.resolve({success: true});
    } catch (err: any) {
      LoggingUtils.error(err);
      if (err instanceof RestError) {
        return Promise.reject(err);
      }
      return Promise.reject(new RestError(400, 'Something went wrong', {systemcode: 1244}));
    }
  }

  async downloadAdminActivityReport(res: any, filter?: any, options?: Options): Promise<any> {
    let headers = [
      {header: 'Login ID', key: 'userCode', width: 32},
      // {header: 'Salutation', key: 'salutationLabel', width: 32},
      {header: 'User Name', key: 'userName', width: 32},
      // {header: 'Email', key: 'email', width: 32},
      {header: 'Profile Name', key: 'profile', width: 32},
      // {header: 'Category', key: 'categoryLabel', width: 32},
      // {header: 'Date of Birth', key: 'dob', width: 32},
      // {header: 'Gender', key: 'genderLabel', width: 32},
      // {header: 'User Type', key: 'userTypeLabel', width: 32},
      // {header: 'Contact Number', key: 'contactNumber', width: 32},
      {header: 'Activity', key: 'activity', width: 32},
      {header: 'Maker Id', key: 'lastModifiedMakerId', width: 32},
      {header: 'Maker Date', key: 'lastModifiedMakerDateTime', width: 32},
      {header: 'Checker Id', key: 'lastModifiedCheckerId', width: 32},
      {header: 'Checker Date', key: 'lastModifiedCheckerDateTime', width: 32},
      {header: 'Old Emp Name', key: 'oldEmployeeName', width: 32},
      {header: 'New Emp Name', key: 'newEmployeeName', width: 32},
      {header: 'Old Profile Name', key: 'oldProfileName', width: 32},
      {header: 'New Profile Name', key: 'newProfileName', width: 32},
      {header: 'Old Email', key: 'oldEmail', width: 32},
      {header: 'New Email', key: 'newEmail', width: 32},
      {header: 'Old Salutation', key: 'oldSalutationLabel', width: 32},
      {header: 'New Salutation', key: 'newSalutationLabel', width: 32},

      {header: 'Old Gender', key: 'oldGenderLabel', width: 32},
      {header: 'New Gender', key: 'newGenderLabel', width: 32},
      {header: 'Old Contact Number', key: 'oldContactNumber', width: 32},
      {header: 'New Contact Number', key: 'newContactNumber', width: 32},

      {header: 'Old Department Code', key: 'oldDepartmentCode', width: 32},
      {header: 'New Department Code', key: 'newDepartmentCode', width: 32},
      {header: 'Old Department', key: 'oldDepartmentName', width: 32},
      {header: 'New Department', key: 'newDepartmentName', width: 32},

      {header: 'Old Branch Code', key: 'oldBranchCode', width: 32},
      {header: 'New Branch Code', key: 'newBranchCode', width: 32},
      {header: 'Old Branch', key: 'oldBranchName', width: 32},
      {header: 'New Branch', key: 'newBranchName', width: 32},
      // {header: 'Old Date of Birth', key: 'oldDob', width: 32},
      // {header: 'New Date of Birth', key: 'newDob', width: 32},
      {header: 'Old Category', key: 'oldCategoryLabel', width: 32},
      {header: 'New Category', key: 'newCategoryLabel', width: 32},
      {header: 'Old User Type', key: 'oldUserTypeLabel', width: 32},
      {header: 'New User Type', key: 'newUserTypeLabel', width: 32},

      // {header: 'Author', key: 'lastModifiedMakerId', width: 32},
    ];
    try {
      const data = await this.find(filter, options);
      const formatData = [];
      for (let activityReport of data) {
        if (activityReport.activity === 'LOCK' || activityReport.activity == 'AUTOMATED DORMANCY') continue; // we want to skip records where the activity is lock
        formatData.push({
          ...activityReport,
          lastModifiedMakerDateTime: moment(activityReport.lastModifiedMakerDateTime, 'YYYY-MM-DD HH:mm:ss').format('DD-MMM-YYYY HH:mm:ss'),
          lastModifiedCheckerDateTime: null
        });
      }
      let excelSheet = ExcelUtils.createExcel(null, 'Admin Activity Report', headers, formatData, null);
      const result = await excelSheet.xlsx.writeBuffer();
      return result;
    } catch (error: any) {
      LoggingUtils.error('Some Error Occured');
      return new RestError(400, 'Error occured while exporting Admin Activity Report', {systemcode: 1364});
    }
  }

  async updateMaxAllowedLoginAttempts(configs: UamLoginAttemptsConfig): Promise<{success: boolean}> {
    try {
      if (!configs.maxDormancyDays && !configs.maxLoginAttempts && !configs.maxDormancyDaysBeforeFirstLogin)
        return Promise.reject(new RestError(422, 'Please provide atleast one config parameter', {systemcode: 1365}));
      await this.uamLoginAttemptsConfigRepository.updateById(1, configs);
      return {success: true};
    } catch (err) {
      throw err;
    }
  }

  getAllParamsFromRequest(jsonObject: any, operation: string) {
    // try {
    //   jsonObject.maxAllowedLoginAttempts = +jsonObject['s:Envelope']['s:Body'][operation]['in']['max_allowed_login_attempts']['_text'];
    // } catch {}
    try {
      jsonObject.emailId = jsonObject['s:Envelope']['s:Body'][operation]['in']['email_id']['_text'];
    } catch {}
    try {
      jsonObject.userName = jsonObject['s:Envelope']['s:Body'][operation]['in']['user_name']['_text'];
    } catch {}
    try {
      jsonObject.uniqueNumber = jsonObject['s:Envelope']['s:Body'][operation]['in']['unique_number']['_text'];
    } catch {}
    try {
      jsonObject.contactNumber = jsonObject['s:Envelope']['s:Body'][operation]['in']['mobile']['_text'];
    } catch {}
    try {
      jsonObject.roleId = jsonObject['s:Envelope']['s:Body'][operation]['in']['role_id']['_text'];
    } catch {}
    try {
      jsonObject.empCode = jsonObject['s:Envelope']['s:Body'][operation]['in']['login_id']['_text'];
    } catch {}
    try {
      jsonObject.employeeCode = jsonObject['s:Envelope']['s:Body'][operation]['in']['employee_code']['_text'];
    } catch {}
    try {
      jsonObject.userType = jsonObject['s:Envelope']['s:Body'][operation]['in']['user_type']['_text'];
    } catch {}
    try {
      jsonObject.category = jsonObject['s:Envelope']['s:Body'][operation]['in']['category']['_text'];
    } catch {}
    try {
      jsonObject.dateOfBirth = jsonObject['s:Envelope']['s:Body'][operation]['in']['date_of_birth']['_text'];
    } catch {}
    try {
      jsonObject.salutation = jsonObject['s:Envelope']['s:Body'][operation]['in']['salutation']['_text'];
    } catch {}
    try {
      jsonObject.gender = jsonObject['s:Envelope']['s:Body'][operation]['in']['gender']['_text'];
    } catch {}
    try {
      jsonObject.branchCode = jsonObject['s:Envelope']['s:Body'][operation]['in']['branch_code']['_text'];
    } catch {}
    try {
      jsonObject.branchName = jsonObject['s:Envelope']['s:Body'][operation]['in']['branch_name']['_text'];
    } catch {}
    try {
      jsonObject.departmentCode = jsonObject['s:Envelope']['s:Body'][operation]['in']['department_code']['_text'];
    } catch {}
    try {
      jsonObject.departmentName = jsonObject['s:Envelope']['s:Body'][operation]['in']['department_name']['_text'];
    } catch {}

    return;
  }

  removeEmptyParams(jsonObject: any){
    if(jsonObject.emailId && jsonObject.emailId.length > 0) delete jsonObject.emailId
    if(jsonObject.userName && jsonObject.userName.length > 0) delete jsonObject.userName
    if(jsonObject.uniqueNumber && jsonObject.uniqueNumber.length > 0) delete jsonObject.uniqueNumber
    if(jsonObject.contactNumber && jsonObject.contactNumber.length > 0) delete jsonObject.contactNumber
    if(jsonObject.roleId && jsonObject.roleId.length > 0) delete jsonObject.roleId
    if(jsonObject.empCode && jsonObject.empCode.length > 0) delete jsonObject.empCode
    if(jsonObject.employeeCode && jsonObject.employeeCode.length > 0) delete jsonObject.employeeCode
    if(jsonObject.userType && jsonObject.userType.length > 0) delete jsonObject.userType
    if(jsonObject.category && jsonObject.category.length > 0) delete jsonObject.category
    if(jsonObject.dateOfBirth && jsonObject.dateOfBirth.length > 0) delete jsonObject.dateOfBirth
    if(jsonObject.salutation && jsonObject.salutation.length > 0) delete jsonObject.salutation
    if(jsonObject.gender && jsonObject.gender.length > 0) delete jsonObject.gender
    if(jsonObject.branchCode && jsonObject.branchCode.length > 0) delete jsonObject.branchCode
    if(jsonObject.branchName && jsonObject.branchName.length > 0) delete jsonObject.branchName
    if(jsonObject.departmentCode && jsonObject.departmentCode.length > 0) delete jsonObject.departmentCode
    if(jsonObject.departmentName && jsonObject.departmentName.length > 0) delete jsonObject.departmentName
  }

  async fetchConfigurations(): Promise<{maxLoginAttempts: number}> {
    try {
      const maxLoginAttemptsInstance = await this.uamLoginAttemptsConfigRepository.findById(1);
      return maxLoginAttemptsInstance;
    } catch (err) {
      throw err;
    }
  }

  async returnAppUserStatusLabel(appUserStatus: number) {
    if (appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.disabled.value) return Option.GLOBALOPTIONS.APPUSERSTATUS.disabled.label;
    if (appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.active.value) return Option.GLOBALOPTIONS.APPUSERSTATUS.active.label;
    if (appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.value) return Option.GLOBALOPTIONS.APPUSERSTATUS.deleted.label;
    if (appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.dormant.value) return Option.GLOBALOPTIONS.APPUSERSTATUS.dormant.label;
    if (appUserStatus === Option.GLOBALOPTIONS.APPUSERSTATUS.locked.value) return Option.GLOBALOPTIONS.APPUSERSTATUS.locked.label;
  }

  async downloadRoleRightsReport(res: any, filter?: any, options?: Options): Promise<any> {
    let headers = [
      {header: 'Profile', key: 'profile', width: 32},
      {header: 'Role Description', key: 'roleDescription', width: 32},
      {header: 'Module', key: 'rights', width: 32},
      {header: 'Rights Description For The Module', key: 'rightsDescription', width: 32},
      {header: 'Role Status', key: 'roleStatus', width: 32},
      {header: 'Rights Status', key: 'rightsStatus', width: 32},
      {header: 'Department', key: 'department', width: 32},
      {header: 'Type of Access', key: 'typeOfAccess', width: 32}
    ];
    try {
      const data = await this.roleRightsRepository.find(filter, options);
      const newData = await this.addDepartmentToResults(data);
      let excelSheet = ExcelUtils.createExcel(null, 'Role Rights Report', headers, newData, null);
      const result = await excelSheet.xlsx.writeBuffer();
      return result;
    } catch (error: any) {
      LoggingUtils.error('Some Error Occured');
      return new RestError(400, 'Error occured while exporting Role Rights Report');
    }
  }

  async addDepartmentToResults(data: Array<Partial<RoleRights>>) {
    if (data && data.length == 0) return data; // return if data is empty

    //find out all unique combinations of profile and departmentName
    let departmentsForAllroles = await this.uamIntegrationRepository.execute(
      "select upper(department_name) as department, upper(profile) as profile from uam_integration ui where department_name is not null and profile is not null and department_name <> '' and profile <> '' and is_latest = true and status <> 'Deleted' group by upper(department_name), upper(profile)"
    );
    if (_.isEmpty(departmentsForAllroles)) {
      departmentsForAllroles = [];
    }

    const profileWiseDepartments: AnyObject = {}; // This will hold the profile/role as key and a concatenation of all departments as value

    //here we populate profileWiseDepartments
    departmentsForAllroles.map((record: DepartmentAndProfile) => {
      let profileNameUpperCase = record['profile'].toUpperCase();
      let departmentNameUpperCase = record['department'].toUpperCase();

      if (!profileWiseDepartments.hasOwnProperty(profileNameUpperCase)) {
        profileWiseDepartments[profileNameUpperCase] = departmentNameUpperCase;
      } else {
        profileWiseDepartments[profileNameUpperCase] += ` | ${departmentNameUpperCase}`;
      }
    });

    //finally we create a new set of records with Department
    const dataWithDepartment = data.map(record => {
      const upperCaseProfileNames = record.profile!.toUpperCase();
      if (profileWiseDepartments.hasOwnProperty(upperCaseProfileNames)) {
        return {...record, department: profileWiseDepartments[upperCaseProfileNames]};
      }
      return {...record};
    });
    return dataWithDepartment;
  }
}
