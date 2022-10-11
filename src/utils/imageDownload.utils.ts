import * as fs from 'fs';
import { IncomingMessage } from 'http';
import * as https from 'https';

export const Download = (
  uri: string,
  filename: string,
  callback?: (fileName: string) => void,
) => {
  const fileStream = fs.createWriteStream(filename);
  const req = https.get(uri, (res: IncomingMessage) => {
    res.pipe(fileStream);

    fileStream.on('error', (err: Error) => {
      console.log('ERROR:', err);
    });

    fileStream.on('close', () => {
      callback && callback(filename);
    });

    fileStream.on('finish', () => {
      fileStream.close();
    });
  });

  req.on('error', (err: Error) => {
    console.log('ERROR:', err);
    throw new Error('Error Downloading Image');
  });

  if (fileStream.path.toString().length > 0) {
    return fileStream.path.toString();
  }
};
