import { injectable, /* inject, */ BindingScope } from '@loopback/core';
import { Count, DataObject, Options, repository } from '@loopback/repository';
import { UserNotificationToken, UserNotificationTokenRepository } from 'common';
import { RestError } from 'common';

// All business loigc goes inside Facade layer
@injectable({ scope: BindingScope.APPLICATION })
export class UserNotificationTokenFacade {
    constructor(@repository(UserNotificationTokenRepository) private userNotificationTokenRepository: UserNotificationTokenRepository) { }

    async create(entity: DataObject<UserNotificationToken>, options?: Options): Promise<UserNotificationToken> {
        return this.userNotificationTokenRepository.create(entity, options);
    }

    async deactivatToken(appUserId: number, where?: Pick<UserNotificationToken, 'registrationToken'>, options?: Options): Promise<Count> {
        if (!where?.registrationToken) {
            throw new RestError(400, 'Token is required!', {systemcode : 1367});
        }
        return this.userNotificationTokenRepository.updateAll({ isActive: false }, { appUserId, registrationToken: where.registrationToken, isActive: true }, options);
    }
}
