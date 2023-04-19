import {authorize} from '@loopback/authorization';
import {service, inject} from '@loopback/core';
import {Count, CountSchema, Filter, FilterExcludingWhere, repository, Where} from '@loopback/repository';
import {del, get, getModelSchemaRef, param, patch, post, put, Request, requestBody, response, RestBindings} from '@loopback/rest';
import {Device} from 'common';
import { uniqueId } from 'underscore';
import {DeviceFacade} from '../facades';
const API_PREFIX = Device.modelName;

//Only REST related logic to be written inside a controller.
//Strictly no use of repositories
@authorize({})
export class DeviceController {
  constructor(
    @service(DeviceFacade) public deviceFacade: DeviceFacade,
    @inject('userProfile') private userProfile: any,
    @inject('additionalHeaders') private additionalHeaders: any,
  ) {}

  @post(`/${API_PREFIX}`)
  @response(200, {
    description: 'Device model instance',
    content: {'application/json': {schema: getModelSchemaRef(Device)}}
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Device, {
            title: 'New Device',
            exclude: ['id']
          })
        }
      }
    })
    device: Omit<Device, 'id'>
  ): Promise<Device> {
    return this.deviceFacade.create(device);
  }

  @get(`/${API_PREFIX}/count`)
  @response(200, {
    description: 'Device model count',
    content: {'application/json': {schema: CountSchema}}
  })
  async count(@param.where(Device) where?: Where<Device>): Promise<Count> {
    return this.deviceFacade.count(where);
  }

  @get(`/${API_PREFIX}`)
  @response(200, {
    description: 'Array of Device model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Device, {includeRelations: false})
        }
      }
    }
  })
  async find(@param.filter(Device) filter?: Filter<Device>): Promise<Device[]> {
    return this.deviceFacade.find(filter);
  }

  @patch(`/${API_PREFIX}`)
  @response(200, {
    description: 'Device PATCH success count',
    content: {'application/json': {schema: CountSchema}}
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Device, {partial: true})
        }
      }
    })
    device: Device,
    @param.where(Device) where?: Where<Device>
  ): Promise<Count> {
    return this.deviceFacade.updateAll(device, where);
  }

  @get(`/${API_PREFIX}/{id}`)
  @response(200, {
    description: 'Device model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Device, {includeRelations: false})
      }
    }
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Device, {exclude: 'where'}) filter?: FilterExcludingWhere<Device>
  ): Promise<Device> {
    return this.deviceFacade.findById(id, filter);
  }

  @patch(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Device PATCH success'
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Device, {partial: true})
        }
      }
    })
    device: Device
  ): Promise<void> {
    await this.deviceFacade.updateById(id, device);
  }

  @put(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Device PUT success'
  })
  async replaceById(@param.path.number('id') id: number, @requestBody() device: Device): Promise<void> {
    await this.deviceFacade.replaceById(id, device);
  }

  @del(`/${API_PREFIX}/{id}`)
  @response(204, {
    description: 'Device DELETE success'
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.deviceFacade.deleteById(id);
  }

  @post(`/${API_PREFIX}/addDeviceIfNotExist`)
  @response(200, {
    description: 'Add a new device if not exist',
    content: {
      'application/json': {
        schema: {
          schema: {
            type: 'object',
            title: 'fetchDeviceDetails response body',
            properties: {
              id: {type: 'number'},
              uniqueId: {type: 'string'},
              biometricSetup: {type: 'boolean'},
              deviceName: {type: 'string'},
              mpinSetup: {type: 'boolean'},
              osName: {type: 'string'},
              osSDKVersion: {type: 'string'},
              preLoginUserId: {type: 'number'}
            }
          }
        }
      }
    }
  })
  async createIfNotExist(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['uniqueId','deviceType','deviceName','osName','versionName','versionCode','osSDKVersion'],
            properties: {
              uniqueId: {
                type: 'string',
                pattern: '^[a-zA-Z0-9-]{16,36}'
              },
              deviceType: {
                type: 'number'
              },
              deviceName: {
                type: 'string'
              },
              osName: {
                type: 'string',
                pattern : '^(Android|iOS|iPadOS)$'
              },
              versionName: {
                type: 'string'
              },
              versionCode:{
                type: 'string'
              },
              osSDKVersion:{
                type: 'string'
              }
            }
          }
        }
      }
    })
    device: Omit<Device, 'id'>
  ): Promise<Partial<Device>> {
    return this.deviceFacade.createIfNotExist(device);
  }

  @post(`/${API_PREFIX}/bindDevice`)
  @response(200, {
    description: 'Bind user device',
    content: {'application/json': {schema: getModelSchemaRef(Device)}}
  })
  async deviceBind(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              uniqueId: {
                type: 'string'
              }
            }
          }
        }
      }
    })
    deviceProps: any
  ): Promise<any> {
    return this.deviceFacade.deviceBind(this.userProfile.appUserId, deviceProps.uniqueId);
  }

  @post(`/${API_PREFIX}/checkVersionAndCreate`)
  @response(200, {
    description: 'Will check the version of device and create device if not exist or update device',
    content: {'application/json': {schema: {type: 'object'}}}
  })
  async checkVersionAndCreate(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              deviceDetails: {
                type: 'object',
                properties: {
                  uniqueId: {
                    type: 'string'
                  },
                  deviceName: {
                    type: 'string'
                  }
                },
                example: `{
                  uniqueId: 'ABCD',
                  deviceName: 'DVNM'
                }`
              },
              buildNumber: {
                type: 'string'
              },
              osType: {
                type: 'number'
              }
            }
          }
        }
      }
    })
    properties: any
  ): Promise<any> {
    return this.deviceFacade.checkVersionAndCreate(properties.deviceDetails, properties.appVersion, properties.osType, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/fetchDeviceDetails`)
  @response(200, {
    description: 'Fetching Device details',
    content: {
      'application/json': {
        schema: {schema: {
          type: 'object',
          title: 'fetchDeviceDetails response body',
          properties: {
            id: {type: 'number'},
            uniqueId: {type: 'string'},
            biometricSetup: {type: 'boolean'},
            deviceName: {type: 'string'},
            mpinSetup: {type: 'boolean'},
            osName: {type: 'string'},
            osSDKVersion: {type: 'string'},
            preLoginUserId: {type: 'number'}
          }
        }}
      }
    }
  })
  async findDeviceDetails(
    @inject(RestBindings.Http.REQUEST) request: Request): Promise<Device[]> {
    return this.deviceFacade.findDeviceDetails(request, this.userProfile.appUserId);
  }

  @post(`/${API_PREFIX}/{appUserId}/deleteExistingDevice`)
  @response(200, {
    description: 'Remove a device if exists',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          example: {
            success: true,
            message: 'Device successfully removed.'
          }
        }
      }
    }
  })
  async deleteExistingDevice(
    @param.path.number('appUserId') appUserId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              uniqueId: {
                type: 'string'
              },
              deviceUniqueId: {
                type: 'string'
              }
            }
          }
        }
      }
    })
    deviceToDelete: any
  ): Promise<Device> {
    return this.deviceFacade.deleteExistingDevice(deviceToDelete.deviceUniqueId, deviceToDelete, appUserId, this.additionalHeaders);
  }

  @get(`/${API_PREFIX}/{appUserId}/fetchRegisteredDevices`)
  @response(200, {
    description: 'Fetching all devices registered to user',
    content: {
      'application/json': {
        schema: {schema: {
          type: 'object',
          title: 'fetchRegisteredDevices response body',
          properties: {
            id: {type: 'number'},
            createdDate: {type: 'string'},
            uniqueId: {type: 'string'},
            biometricSetup: {type: 'boolean'},
            deviceName: {type: 'string'},
            osName: {type: 'string'},
            osSDKVersion: {type: 'string'},
            preLoginUserId: {type: 'number'},
          }
        }}
      }
    }
  })
  async fetchRegisteredDevices(): Promise<Device[]> {
    return this.deviceFacade.fetchRegisteredDevices(this.userProfile.appUserId);
  }

}
