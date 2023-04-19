import {LoggingUtils, ValidateSequence, WmsGenericMessage, WmsGenericMessageRepository} from 'common';
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

export async function wmsGenericMessage() {

    const app = new UserManagementService();
    await app.boot();
    await DatasourceInitialization.init(app);
    RepositoryInitialization.init(app);
    const baseData: Array<Partial<WmsGenericMessage>> = [
        {
            "errorCode": "0",
            "errorMessage": "0",
            "custErrorCode": "0",
            "id": 1,
            "wmsGenericMessageStatus": 2
        },
        {
            "errorCode": "10011",
            "errorMessage": "Validation failed ",
            "custErrorCode": "10011",
            "id": 2,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "1003",
            "errorMessage": "End date should be greater than or equal to purge date",
            "custErrorCode": "1003",
            "id": 3,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "1004",
            "errorMessage": "Start date should be greater than or equal to purge date",
            "custErrorCode": "1004",
            "id": 4,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "1206",
            "errorMessage": "Fatal Error has occurred",
            "custErrorCode": "1206",
            "id": 5,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "1210",
            "errorMessage": "Database Error :",
            "custErrorCode": "1210",
            "id": 6,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "1294",
            "errorMessage": "Oops! We are yet to receive the status of this transaction\/query. In case of a financial transaction, please check your account statement before reinitiating it.",
            "custErrorCode": "1294",
            "id": 7,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "18",
            "errorMessage": "Hold Funds Present - Refer to Drawer ( Account would Overdraw )",
            "custErrorCode": "18",
            "id": 8,
            "wmsGenericMessageStatus": 2
        },
        {
            "errorCode": "200",
            "errorMessage": "Oops! We are yet to receive the status of this transaction\/query. In case of a financial transaction, please check your account statement before reinitiating it.",
            "custErrorCode": "1000",
            "id": 9,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "2077",
            "errorMessage": "Invalid user id",
            "custErrorCode": "2077",
            "id": 10,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "2233",
            "errorMessage": "Message validation error:The original message for this reversal is absent or has already been reversed or autoreversed. Reversal processing aborted",
            "custErrorCode": "2233",
            "id": 11,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "2518",
            "errorMessage": "Account Number is Missing ....",
            "custErrorCode": "2518",
            "id": 12,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "2650",
            "errorMessage": "Customer not found",
            "custErrorCode": "2650",
            "id": 13,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "2778",
            "errorMessage": "Account not found",
            "custErrorCode": "2778",
            "id": 14,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "2792",
            "errorMessage": "No record found",
            "custErrorCode": "2792",
            "id": 15,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "2799",
            "errorMessage": "CASA A\/C not found",
            "custErrorCode": "2799",
            "id": 16,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "2853",
            "errorMessage": "Account not found",
            "custErrorCode": "2853",
            "id": 17,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "2928",
            "errorMessage": "Invalid account number",
            "custErrorCode": "2928",
            "id": 18,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "2932",
            "errorMessage": "No transaction found in specified period",
            "custErrorCode": "2932",
            "id": 19,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "2950",
            "errorMessage": "Start date is greater than End date",
            "custErrorCode": "2950",
            "id": 20,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "2988",
            "errorMessage": " Account details have been changed since last request.",
            "custErrorCode": "2988",
            "id": 21,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "3038",
            "errorMessage": "Date must be greater than or equal to process date",
            "custErrorCode": "3038",
            "id": 22,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "3070",
            "errorMessage": "Invalid Account Status",
            "custErrorCode": "3070",
            "id": 23,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "31",
            "errorMessage": "Insufficient funds in the debit account.",
            "custErrorCode": "31",
            "id": 24,
            "wmsGenericMessageStatus": 2
        },
        {
            "errorCode": "3109",
            "errorMessage": "Debit Account is Closed",
            "custErrorCode": "3109",
            "id": 25,
            "wmsGenericMessageStatus": 2
        },
        {
            "errorCode": "3110",
            "errorMessage": "Debit \/ Credit Account is Blocked",
            "custErrorCode": "3110",
            "id": 26,
            "wmsGenericMessageStatus": 2
        },
        {
            "errorCode": "3111",
            "errorMessage": "No Debits allowed",
            "custErrorCode": "3111",
            "id": 27,
            "wmsGenericMessageStatus": 2
        },
        {
            "errorCode": "3112",
            "errorMessage": "No credits allowed",
            "custErrorCode": "3112",
            "id": 28,
            "wmsGenericMessageStatus": 2
        },
        {
            "errorCode": "3115",
            "errorMessage": " Debit \/ Credit Account is Dormant",
            "custErrorCode": "3115",
            "id": 29,
            "wmsGenericMessageStatus": 2
        },
        {
            "errorCode": "3259",
            "errorMessage": "Account has Credit Override status",
            "custErrorCode": "3259",
            "id": 30,
            "wmsGenericMessageStatus": 2
        },
        {
            "errorCode": "3260",
            "errorMessage": "Account has Debit Override status",
            "custErrorCode": "3260",
            "id": 31,
            "wmsGenericMessageStatus": 2
        },
        {
            "errorCode": "3403",
            "errorMessage": "Oops! We are yet to receive the status of this transaction\/query. In case of a financial transaction, please check your account statement before reinitiating it.",
            "custErrorCode": "3403",
            "id": 32,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "3423",
            "errorMessage": "Customer Id is incorrect, customer does not exist",
            "custErrorCode": "3423",
            "id": 33,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "3431",
            "errorMessage": "Invalid customer id",
            "custErrorCode": "3431",
            "id": 34,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "3574",
            "errorMessage": "Invalid currency Expected INR.  Found USD {2}",
            "custErrorCode": "3574",
            "id": 35,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "3643",
            "errorMessage": "File not found",
            "custErrorCode": "3643",
            "id": 36,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "3700",
            "errorMessage": "Customer Account Mismatch",
            "custErrorCode": "3700",
            "id": 37,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "3769",
            "errorMessage": "Invalid Account Number",
            "custErrorCode": "3769",
            "id": 38,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "3878",
            "errorMessage": "Invalid bank code",
            "custErrorCode": "3878",
            "id": 39,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "3915",
            "errorMessage": "Non-existent reference transaction number",
            "custErrorCode": "3915",
            "id": 40,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "4457",
            "errorMessage": "Authorised record not found",
            "custErrorCode": "4457",
            "id": 41,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "60001",
            "errorMessage": "Account does not belong to specified Customer",
            "custErrorCode": "60001",
            "id": 42,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "60002",
            "errorMessage": "Amount insufficient for Funds Transfer .",
            "custErrorCode": "60002",
            "id": 43,
            "wmsGenericMessageStatus": 2
        },
        {
            "errorCode": "60003",
            "errorMessage": "No successful transaction found ",
            "custErrorCode": "60003",
            "id": 44,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "60009",
            "errorMessage": "Invalid Order Id.",
            "custErrorCode": "60009",
            "id": 45,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "6083",
            "errorMessage": "Invalid Branch Code",
            "custErrorCode": "6083",
            "id": 46,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "6860",
            "errorMessage": "Selected Product is not mapped to this Branch",
            "custErrorCode": "6860",
            "id": 47,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "7010",
            "errorMessage": "Payout reversal not successful",
            "custErrorCode": "7010",
            "id": 48,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "80002",
            "errorMessage": "accountNumber cannot be null or blank",
            "custErrorCode": "80002",
            "id": 49,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "80013",
            "errorMessage": "Transaction-channel XREF Configuration missing",
            "custErrorCode": "80013",
            "id": 50,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "80181",
            "errorMessage": "No Data Found.",
            "custErrorCode": "80181",
            "id": 51,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : false,
        },
        {
            "errorCode": "80253",
            "errorMessage": "Limit has expired.",
            "custErrorCode": "80253",
            "id": 52,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "83630",
            "errorMessage": "Invalid Customer Id",
            "custErrorCode": "83630",
            "id": 53,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "83633",
            "errorMessage": "Debit Account Validation failed",
            "custErrorCode": "83633",
            "id": 54,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "83634",
            "errorMessage": "Invalid Credit Account.",
            "custErrorCode": "83634",
            "id": 55,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "83635",
            "errorMessage": "High level Memo present on Debit account.",
            "custErrorCode": "83635",
            "id": 56,
            "wmsGenericMessageStatus": 2
        },
        {
            "errorCode": "83636",
            "errorMessage": "Memo present on Credit account.",
            "custErrorCode": "83636",
            "id": 57,
            "wmsGenericMessageStatus": 2
        },
        {
            "errorCode": "83637",
            "errorMessage": "Nominee not found for this account number",
            "custErrorCode": "83637",
            "id": 58,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "943",
            "errorMessage": "KYC Pending for the Linked Customer(s)",
            "custErrorCode": "943",
            "id": 59,
            "wmsGenericMessageStatus": 2
        },
        {
            "errorCode": "DATE006",
            "errorMessage": "Invalid date",
            "custErrorCode": "DATE006",
            "id": 60,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },
        {
            "errorCode": "XFC_MSG919",
            "errorMessage": "No Data Found.",
            "custErrorCode": "XFC_MSG919",
            "id": 61,
            "wmsGenericMessageStatus": 1,
            "inquiryFlag" : true,
        },

    ]

    const repository = await app.getRepository(WmsGenericMessageRepository);
    //await repository.createAll(baseData);
    for (const record of baseData) {
      try {
        let dataExists = await repository.findOne({
          where: {id : record.id}
        });
  
        if (dataExists) {
          await repository.updateById(dataExists.id, record);
        } else {
          await repository.create(record);
        }
      } catch (error) {
        LoggingUtils.error(error.message);
      }
    }
    await ValidateSequence.checkIfSequenceIsCorrect(repository, WmsGenericMessage.definition.settings.postgresql.tableName, 'id');
    LoggingUtils.info('base data created successfully');
    //exit the process when everything is done
    process.exit(0);

}


wmsGenericMessage().catch(err => {
    LoggingUtils.error('Could not pseudonymise data- ' + err);
    process.exit(1);
});