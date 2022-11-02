import { appendFile, existsSync, mkdir, readdir, unlink } from 'fs';

const writeFile = (path: string, content: string): void => {
  appendFile(path, content, (err) => {
    if (err) {
      console.log('Error on Appending', err);
    }
  });
};

export const createExceptionFile = (content: string): void => {
  const olddir = __dirname.split('/');
  olddir.splice(olddir.length - 4, 4);
  const dir = `${olddir.join('/')}/src/logs/`;
  if (!existsSync(dir)) {
    mkdir(dir, (err) => {
      if (err) {
        console.log('Error in creation', err);
      } else {
        writeFile(
          dir + new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
          content,
        );
      }
    });
  } else {
    readdir(dir, (err, files) => {
      if (err) {
        console.log('Error in directory reading');
      } else {
        if (files.length) {
          files.forEach((file) => {
            if (new Date(file) > new Date(new Date().setHours(0, 0, 0, 0))) {
              unlink(dir + `${file}`, (err) => {
                if (err) {
                  console.log('Error in removing file', err);
                } else {
                  writeFile(
                    dir +
                      new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
                    content,
                  );
                }
              });
            } else if (
              new Date(file) === new Date(new Date().setHours(0, 0, 0, 0))
            ) {
              writeFile(dir + file, content);
            }
          });
        } else {
          writeFile(dir + files, content);
        }
      }
    });
  }
};
