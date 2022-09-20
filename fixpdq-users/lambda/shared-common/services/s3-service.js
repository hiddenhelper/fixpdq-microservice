const AWS = require('aws-sdk');
import { services as fpdqServices } from "@fixpdq/common";
const { winstonLogger: Log } = fpdqServices.loggerService;
const {Buffer} = require('buffer');

const s3Bucket = new AWS.S3({
    apiVersion: "2006-03-01",
    region: "ap-southeast-2",
})

export async function getImageUrl(imageName, imageData) {
    const base64Data = new Buffer.from(imageData.data.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const type= imageData.type;

    const params = {
        Bucket: "fixpdq-person-storage",
        Key: `${imageName}.${type}`, // type is not required
        Body: base64Data,
        ACL: 'public-read',
        ContentEncoding: 'base64', // required
        ContentType: `image/${type}` // required. Notice the back ticks
    }

    try {
        const { Location, Key } = await s3Bucket.upload(params).promise();
        return Location;
    } catch (error) {
        Log.error(`[service] There was an error with 'getImageUrl' ${error.message}`);
        throw error;
    }
}