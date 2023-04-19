import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {CryptoUtils, LoggingUtils, RestError} from 'common';
import moment from 'moment-timezone';
import {isEmpty} from 'underscore';

@injectable({scope: BindingScope.APPLICATION})
export class HSLRedirectFacade {
  constructor() {}

  /**
   * @description Bussiness logic to generate redirect url for given tag
   * @param tag - Requires to identify redirect url
   * @returns
   */
  async getRedirectURL(tag: string): Promise<string | object> {
    return new Promise((resolve, reject) => {
      try {
        if (
          isEmpty(process.env.NODE_ENV) ||
          isEmpty(process.env.USR_MGMT_FCD_HSL_KEY) ||
          isEmpty(process.env.USR_MGMT_FCD_HSL_IV) ||
          isEmpty(process.env.USR_MGMT_FCD_HSL_ALGO) ||
          isEmpty(process.env.USR_MGMT_FCD_HSL_REDIRECT_BASE_URL)
        ) {
          throw new Error('Environment variables cannot be empty');
        }

        const env = String(process.env.USR_MGMT_FCD_NODE_ENV);
        const key = String(process.env.USR_MGMT_FCD_HSL_KEY);
        const iv = String(process.env.USR_MGMT_FCD_HSL_IV);
        const algo = String(process.env.USR_MGMT_FCD_HSL_ALGO);
        const reUrl = String(process.env.USR_MGMT_FCD_HSL_REDIRECT_BASE_URL);

        const now = moment().format('DDMMYYYYHHmmss');
        const id = `wealthapp${now}_${tag}`;

        const encryptid = CryptoUtils.encrypt(id, algo, key, iv);

        resolve({redirectUrl: `${reUrl}?id=${encodeURIComponent(encryptid)}`});
      } catch (error) {
        LoggingUtils.error(error);
        reject(new RestError(500, 'Environmnet variables not set', {systemcode : 1323}));
      }
    });
  }
}
