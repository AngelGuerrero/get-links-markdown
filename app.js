const fs = require('fs');
const path = require('path');
const linkCheck = require('link-check');
const markdownLinkExtractor = require('markdown-link-extractor');

/**
 * Function for extract links from a file
 * 
 * @param {string} path Absolute file path for extract links
 */
var extractLinks = function (path) {
  const markdown = fs.readFileSync(path).toString();

  return markdownLinkExtractor(markdown);
};

function walk(dir) {
  var results = [];
  var list = fs.readdirSync(dir);

  list.forEach(function (file) {
    // console.log(file);

    var newdir = dir + '/' + file;
    var stat = fs.statSync(newdir);

    // console.log(newdir);

    // Check if is a subdirectory
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      results = results.concat(walk(newdir));
    } else {
      /* Is a file */
      results.push(`${newdir}`);
    }
  });
  return results;
}

var main = function (path, options) {
  // Store the links
  let linkArray = [];

  // Store the markdown files
  let filesArray = [];

  return new Promise((resolve, reject) => {
    path = fs.realpathSync(path);
    console.log(`Path: ${path}`);

    const stats = fs.statSync(path);

    if (stats.isDirectory()) {
      console.log("Es un directorio\n");

      // Get the absolute path of files
      filesArray = walk(path);

      // Count for exit the cicle
      let counter = 0;

      // Count of links
      let countLinks = 0;

      filesArray.forEach((file) => {
        console.log(`Extrayendo enlaces del directorio: ${file}`);
        let extractedLinks = extractLinks(file);
        countLinks += extractedLinks.length;

        console.log("Enlaces del archivo: ");
        extractedLinks.forEach((link) => {
          console.log(`- ${link}`);

          linkCheck(link, (err, result) => {

            // Exit of function linkCheck if error occurs
            if (err) return reject(err);

            if (options.validate) {
              linkArray.push({
                file: file,
                href: result.link,
                // text: result.text, //Undefined
                status: result.statusCode,
                ok: result.status === 'alive'
              });
              counter++;
            } else {
              linkArray.push({
                file: file,
                href: result.link,
                // text: result.text, // undefined
              });
              counter++;
            }

            // The promise is fulfilled  
            if (counter === countLinks) resolve(linkArray);
          });
        });
        console.log("\n");
      });

    } else {
      console.log(`Es sólo un archivo ${path}`);

      const extactedLinks = extractLinks(path);

      extactedLinks.forEach(link => {
        console.log(`Evaluando enlace: ${link}`);

        linkCheck(link, (err, result) => {

          // Exit of function linkCheck if error occurs
          if (err) return reject(err);

          if (options.validate)
            linkArray.push({
              file: path,
              href: result.link,
              // text: result.text, //Undefined
              status: result.statusCode,
              ok: result.status === 'alive'
            });
          else
            linkArray.push({
              file: path,
              href: result.link,
              // text: result.text, // undefined
            });

          // The promise is fulfilled  
          if (linkArray.length === extactedLinks.length) resolve(linkArray);
        });

      });

    }

  });

};



main('public/', {
    validate: true
  })
  .then((links) => console.log(links))
  .catch((reason) => console.error(`Ha ocurrido un error: ${reason}`));