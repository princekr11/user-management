import {injectable, /* inject, */ BindingScope, inject} from '@loopback/core';
import {Count, DataObject, Filter, FilterExcludingWhere, Options, repository, Where} from '@loopback/repository';
import {Request} from '@loopback/rest';
import {Device, DeviceRelations, DeviceRepository, CryptoUtils, RestError, LoggingUtils, AppVersionRepository, AppVersion, AppUserRepository} from 'common';
import {isEmpty, where} from 'underscore';

const { randomUUID } = require('crypto');
// All business loigc goes inside Facade layer
@injectable({scope: BindingScope.APPLICATION})
export class DeviceFacade {
  constructor(
    @repository(DeviceRepository) private deviceRepository: DeviceRepository,
    @repository(AppVersionRepository) private appVersionRepository: AppVersionRepository,
    @repository(AppUserRepository) private appUserRepository: AppUserRepository
  ) {}

  async create(entity: DataObject<Device>, options?: Options): Promise<Device> {
    return this.deviceRepository.create(entity, options);
  }

  async createAll(entities: DataObject<Device>[], options?: Options): Promise<Device[]> {
    return this.deviceRepository.createAll(entities, options);
  }

  async save(entity: Device, options?: Options): Promise<Device> {
    return this.deviceRepository.save(entity, options);
  }

  async find(filter?: Filter<Device>, options?: Options): Promise<(Device & DeviceRelations)[]> {
    return this.deviceRepository.find(filter, options);
  }

  async findOne(filter?: Filter<Device>, options?: Options): Promise<(Device & DeviceRelations) | null> {
    return this.deviceRepository.findOne(filter, options);
  }

  async findById(id: number, filter?: FilterExcludingWhere<Device>, options?: Options): Promise<Device & DeviceRelations> {
    return this.deviceRepository.findById(id,filter, options);
  }

  async update(entity: Device, options?: Options): Promise<void> {
    return this.deviceRepository.update(entity, options);
  }

  async delete(entity: Device, options?: Options): Promise<void> {
    return this.deviceRepository.delete(entity, options);
  }

  async updateAll(data: DataObject<Device>, where?: Where<Device>, options?: Options): Promise<Count> {
    return this.deviceRepository.updateAll(data, where, options);
  }

  async updateById(id: number, data: DataObject<Device>, options?: Options): Promise<void> {
    return this.deviceRepository.updateById(id, data, options);
  }

  async replaceById(id: number, data: DataObject<Device>, options?: Options): Promise<void> {
    return this.deviceRepository.replaceById(id, data, options);
  }

  async deleteAll(where?: Where<Device>, options?: Options): Promise<Count> {
    return this.deviceRepository.deleteAll(where, options);
  }

  async deleteById(id: number, options?: Options): Promise<void> {
    return this.deviceRepository.deleteById(id, options);
  }

  async count(where?: Where<Device>, options?: Options): Promise<Count> {
    return this.deviceRepository.count(where, options);
  }

  async exists(id: number, options?: Options): Promise<boolean> {
    return this.deviceRepository.exists(id, options);
  }

  async deviceBind(userId: number, deviceId: number, options?: Options): Promise<any> {
    try {
      if (isEmpty(deviceId)) {
        return new RestError(400, 'Device uniqueId is required', {systemcode: 1301});
      }
      const device: any = await this.deviceRepository
        .findOne({
          where: {and: [{id: deviceId}, {appUserId: userId}]}
        })
        .catch(err => {
          throw new Error(err);
        });
      if (isEmpty(device)) {
        return new RestError(400, 'device not found', {systemcode : 1033});
      }
      const concatString = `${device.uniqueId}-${device.osName}-${device.versionCode}-${device.osSDKVersion}`;
      const bindingIdentifier = await CryptoUtils.encrypt(concatString);
      await this.deviceRepository.updateById(device.id, {bindingData: bindingIdentifier});
      return {...device, bindingData: bindingIdentifier};
    } catch (error) {
      LoggingUtils.error(error);
      return new RestError(400, 'Error occured while binding your device!', {systemcode : 1036});
    }
  }

  async createIfNotExist(entity: DataObject<Device>, options?: Options): Promise<Partial<Device>> {
    // check if version is new if not check if current version is force update
    //
    // if not create a new device
    // finding if device exists
    // when we search for active devices(isActive is true) for the user and if count >= 3, then reject with
    // message 'You are already logged on 3 devices. Please remove atleast one device from My Account section to continue'.
    // is device exists and isActive is true then we respond with 117.
    // if device exists and isActive is false then we save (updating details).
    try{
      const deviceExist = await this.deviceRepository
        .findOne({
          where: {uniqueId: entity.uniqueId}
        })
        .catch(err => {
          LoggingUtils.error('Error occured while finding device');
          throw new RestError(400, 'Error occured while finding device',{systemcode : 1033});
        });
      if (!isEmpty(deviceExist) && deviceExist?.isActive === true) {
        throw new RestError(400, 'Device already exists', {id: deviceExist?.id, systemcode : 1034});
      }
      else if (!isEmpty(deviceExist) && deviceExist?.isActive === false) {
        const updatedDevice = await this.deviceRepository.updateById(deviceExist.id, entity)
        let addedDevice = await this.deviceRepository.findOne({
          where: {
          id: deviceExist.id
          },
          fields: {'id':true, 'uniqueId': true, 'biometricSetup': true, 'deviceName': true,
          'osName': true, 'osSDKVersion': true, 'preLoginUserId': true}

        }).catch(err => {
          LoggingUtils.error(`Error occured while updating device. Error : ${err}`);
          throw new RestError(400, 'Error occured while updating device', {systemcode : 1303} );
          })

          let responseObject = {}
          if (addedDevice!.appUserId){
            const userDetails = await this.appUserRepository.findById(addedDevice!.appUserId)
            if (userDetails.mpinSetup){
              responseObject = {...addedDevice, mpinSetup: true}
            } else {
              responseObject = {...addedDevice, mpinSetup: false}
            }
          } else {
            responseObject = {...addedDevice, mpinSetup: false}
          }
          return responseObject!;
        }


      // In case of a new device, the backend should generate a token and send to the frontend
      const uniqueUUID = randomUUID()
      entity["uniqueId"] = uniqueUUID
      entity.registeredDate = new Date();
      const newDevice: Device = await this.deviceRepository.create(entity)
      const addedDevice = await this.deviceRepository.findOne({
        where: {
        id: newDevice.id
        },
        fields: {'id':true, 'uniqueId': true, 'biometricSetup': true, 'deviceName': true,
        'mpinSetup': true, 'osName': true, 'osSDKVersion': true, 'preLoginUserId': true}
      }).catch(err => {
        LoggingUtils.error('Error occured while adding new device');
        throw new RestError(400, 'Error occured while adding new device', {systemcode : 1304});
      });
     return addedDevice!;
    }
    catch(err: any | RestError) {
      if(err instanceof RestError){
        return Promise.reject(err);
      }
      else{
        throw err;
      }
    }
  }

  async checkVersionAndCreate(entity: Partial<Device>, buildNumber: string, osType: number, options?: Options): Promise<any> {
    let currentVersionData: AppVersion;
    return new Promise(async (resolve, reject) => {
      this.appVersionRepository
        .findOne({
          where: {
            isActive: true,
            buildNumber: buildNumber,
            osType: osType
          }
        }, options)
        .then((currentVersion: AppVersion | null) => {
          if (!currentVersion) {
            return Promise.reject(new RestError(404, 'Active version not found', {systemcode : 1305} ));
          }
          currentVersionData = currentVersion;
          if (currentVersion.activeVersionFlag) {
            return Promise.resolve(currentVersion);
          }
          return this.appVersionRepository.findOne({
            where: {
              osType: osType,
              activeVersionFlag: true,
              isActive: true
            }
          }, options);
        })
        .then((activeAppVersion: AppVersion | null) => {
          if (!activeAppVersion) {
            return Promise.reject(new RestError(404, 'Active App Version not found', {systemcode : 1306}));
          }
          if (currentVersionData.id === activeAppVersion.id) {
            return Promise.resolve({});
          } else {
            if (activeAppVersion.isForceUpdate) {
              return Promise.reject(new RestError(400, 'Need to update the application',{systemcode : 1037}));
            }
            return Promise.resolve({});
          }
        })
        .then(() => {
          return this.deviceRepository.findOne({
            where: {
              uniqueId: entity.uniqueId,
              isActive: true
            }
          }, options);
        })
        .then((deviceData: Device | null): Promise<Device | Count> => {
          if (!deviceData) {
            return this.deviceRepository.create({
              uniqueId: entity.uniqueId as string,
              appVersionId: currentVersionData.id,
              deviceName: entity.deviceName,
              registeredDate: new Date()
            }, options);
          } else {
            deviceData.uniqueId = entity.uniqueId as string;
            deviceData.appVersionId = currentVersionData.id;
            deviceData.deviceName = entity.deviceName;
            return this.deviceRepository.save(deviceData, options);
          }
        })
        .then(data => {
          resolve({success: true});
        })
        .catch((err: any) => {
          LoggingUtils.error(err);
          return reject(err);
        });
    });
  }

  async findDeviceDetails(request: Request, appUserId: any):Promise<any>{
    try{
      if(!(request.headers && request.headers["uniqueid"])) return Promise.reject(new RestError(465, 'Device unique id is missing from headers', {systemcode : 1307}))
      const uniqueId: string = request.headers["uniqueid"] as string

      let filter ={};
        if (!appUserId){
          filter = {
            isActive: true,
            uniqueId: uniqueId
          }
        }else{
          filter = {
            isActive: true,
            uniqueId: uniqueId,
            appUserId: appUserId
          }
        }
        let deviceDetails = await this.deviceRepository
        .findOne({
          where: {
           ...filter
          },
          fields: {'id':true, 'uniqueId': true, 'biometricSetup': true, 'deviceName': true,
          'osName': true, 'osSDKVersion': true, 'preLoginUserId': true, 'appUserId': true}
        })
        if (!deviceDetails) {
          return new RestError(400, 'device not found', {systemcode: 1033});
        } else {
          let responseObject = {};
          if (deviceDetails.appUserId) {
            const userDetails = await this.appUserRepository.findById(deviceDetails.appUserId);
            if (userDetails.mpinSetup) {
              responseObject = {...deviceDetails, mpinSetup: true, name: userDetails.name};
            } else {
              responseObject = {...deviceDetails, mpinSetup: false, name: userDetails.name};
            }
          } else {
            responseObject = {...deviceDetails, mpinSetup: false};
          }
          return responseObject;
        }
      }catch (error){
        LoggingUtils.error(error);
        return new RestError(400, 'Error occured while fetching Device Details!', {systemcode : 1308});
      }
  }

  async deleteExistingDevice(deviceUniqueId: string, deviceToDelete: any, appUserId: number, options?: Options): Promise<any> {
    try{
      if (deviceToDelete.uniqueId == deviceUniqueId){
        throw new RestError(400, 'Cannot De-register logged in device');
      }
      const checkIfDeviceExists = await this.deviceRepository.findOne({
      where: {
        appUserId : appUserId,
        uniqueId : deviceToDelete.uniqueId
      }
      }).catch((err: any) => {
        LoggingUtils.error('Error occured while finding device');
        throw new RestError(400, 'Error occured while finding device', {systemcode : 1033});
      })
      if(!isEmpty(checkIfDeviceExists)){
        await this.deviceRepository.updateById(
          checkIfDeviceExists?.id, {isActive: false , appUserId: undefined})
          .catch((err: any) => {
          LoggingUtils.error('Error occured while updating device');
          throw new RestError(400, 'Error occured while updating device', {systemcode : 1303});
        })
        return {
          success: true,
          message: 'Device successfully De-registered.'
        };
      }else{
        throw new RestError(400, 'Device does not exists', {systemcode : 1309});
      }
    }
    catch(err: any | RestError){
      throw err;
    }
  }

  async fetchRegisteredDevices(appUserId: any):Promise<any>{
    try{
      const deviceDetails = await this.deviceRepository.find(
        {
          where: {
            isActive: true,
            appUserId: appUserId
          },
          fields: {'id':true, 'uniqueId': true, 'biometricSetup': true, 'createdDate': true,
          'osName': true, 'osSDKVersion': true, 'preLoginUserId': true, 'deviceName': true, 'registeredDate': true}
        }
      )
      .catch((err: any) => {
        LoggingUtils.error('Error occured while finding devices');
        throw new RestError(400, 'Error occured while finding devices', {systemcode : 1033});
      })
      return deviceDetails;
    } catch(error){
      LoggingUtils.error(error);
      throw error;
    }
  }

}

