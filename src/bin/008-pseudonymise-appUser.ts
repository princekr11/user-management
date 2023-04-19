import {AppUser, AppUserRepository, CryptoUtils, LoggingUtils} from 'common';
import * as dotenv from 'dotenv';
import {UserManagementService} from '../application';
import {DatasourceInitialization} from '../datasource-initialization';
import {RepositoryInitialization} from '../repository-initiliazation';
import * as path from 'path';
import _ from 'underscore';
import Bluebird from 'bluebird';

try {
  dotenv.config({path: path.resolve(__dirname, '../../.env')});
} catch (error) {}

export async function pseudonymisation() {

    const app = new UserManagementService();
    await app.boot();
    await DatasourceInitialization.init(app);
    RepositoryInitialization.init(app);
    const appUserRepository = await app.getRepository(AppUserRepository);

    let batchSize: number = 1000
    const numberOfRecords = await appUserRepository.count()

    let batches = [];
    let offset: number = 0;
    let count = numberOfRecords.count;
    while (count > 0) {
      const currentOffset = offset;
      batches.push({
        limit: Number(batchSize),
        offset: Number(currentOffset),
      });
      count = count - batchSize;
      offset = offset + batchSize;
    }

    return Bluebird.map(batches, async (batchObject: any): Promise<any> => {
        return processBatch(batchObject) 
    }).then(data =>{
        LoggingUtils.info('data pseudonymised successfully');
        //exit the process when everything is done
        process.exit(0);
    });

    async function processBatch(batchObject: any){
        let limit = batchObject.limit;
        let offset = batchObject.offset;
    
        let appUserArray = await appUserRepository.find(
            {
                limit: limit,
                offset: offset,
            })
        const keysToEncode = [
            {tncAcceptanceIpAddress: AppUser.definition.properties.tncAcceptanceIpAddress}
        ]
        const encodedData = CryptoUtils.encodeDataObjectPseudonym(appUserArray, keysToEncode);
        let iterableEncodedData = [];
        let i = 0;
        while(encodedData[i]){
            iterableEncodedData.push(encodedData[i])
            i++;
        }
        for (let obj of iterableEncodedData){
            await appUserRepository.updateById(obj.id, obj)
        }
    };

}


pseudonymisation().catch(err => {
    LoggingUtils.error('Could not pseudonymise data- ' + err);
    process.exit(1);
});
