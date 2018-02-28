/*
* 2017-present Gautam Mittal
*/

const fs = require('fs');
const marked = require('marked');
const moment = require('moment');
const rss = require('rss');

marked.setOptions({ gfm: true, tables: true,
    highlight: function (code) {
        return require(`highlight.js`).highlightAuto(code).value;
    }
});

let ls = (dir) => {
    return fs.readdirSync(`${__dirname}/${dir}`).filter((f) => {
        return f.substr(0, 1) != `.`;
    });
}

let extract = (contentDir, postFileName) => {
    const fileContent = fs.readFileSync(`${contentDir}/${postFileName}`, `utf-8`)
    const start = fileContent.indexOf(`---START_METADATA---`);
    const end = fileContent.indexOf(`---END_METADATA---`);
    const jsonStart = fileContent.substr(start, end).indexOf(`{`);
    return {
        'slug': postFileName.substr(11, postFileName.length-14),
        'timestamp': moment(postFileName.substr(0, 10), [`YYYY-MM-DD`]).format(`LL`),
        'metadata': JSON.parse(fileContent.substr(jsonStart, end-jsonStart)),
        'content': fileContent.substr(end+`---END_METADATA---`.length, fileContent.length)
    }
}

/*
  contentDir: directory of markdown files
  outputDir: build script output of HTML files
  ignore: file in contentDir of private markdown files
*/
let compile = (contentDir, outputDir, ignore) => {
    if (!fs.existsSync(contentDir)) throw `No content directory "${contentDir}" found.`;
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
    let _ignore = fs.readFileSync(`${contentDir}/${ignore}`, `utf-8`).split(`\n`).filter(p => p.length > 0);
    let postListMarkup = [];

    // Setup RSS feed
    let feed = new rss({
        title: `Senioritis`,
        site_url: `https://senioritis.us`,
        feed_url: `https://senioritis.us/feed.xml`,
        language: `en`
    });

    // Process each post
    let episodeNumber = 0;
    ls(contentDir).forEach((post) => {
        episodeNumber++;
        const metadata = extract(contentDir, post).metadata;

        // Build list of posts displayed on the homepage
        if (_ignore.indexOf(post) == -1) {
          const listTemplate = `<div class="story">
              <a href="/${outputDir}/${extract(contentDir, post).slug}">
              <img class="reg" src="${metadata.image}" />
              <img class="alt" src="${metadata.altimage}" />
              </a>
              </div>`;
          postListMarkup.unshift(listTemplate);
        }

        // Build individual posts from template
        marked(extract(contentDir, post).content, function (err, content) {
            if (err) throw err;
            const postTemplate = fs.readFileSync(`${__dirname}/templates/post.html`, `utf-8`)
                                   .replace(/{POST-TITLE}/g, metadata.title)
                                   .replace(/{POST-DATE}/g, extract(contentDir, post).timestamp)
                                   .replace(/{EPISODE-NUMBER}/g, episodeNumber)
                                   .replace(/{POST-GUESTS}/g, metadata.guests)
                                   .replace(/{POST-IMAGE}/g, metadata.image)
                                   .replace(/{POST-CONTENT}/g, content);
            // Write post to disk
            const targetDir = `${outputDir}/${extract(contentDir, post).slug}`;
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);
            fs.writeFileSync(`${targetDir}/index.html`, postTemplate);

            // Add the post to RSS
            if (_ignore.indexOf(post) == -1) {
              feed.item({
                  title: metadata.title,
                  url: `https://senioritis.us/${targetDir}`,
                  description: content,
                  date: new Date(extract(contentDir, post).timestamp),
              });
            }
        });
    });

    // Write RSS feed.xml
    fs.writeFileSync(`feed.xml`, feed.xml(`   `));

    // Build home page
    const indexTemplate = fs.readFileSync(`${__dirname}/templates/index.html`, `utf-8`)
                            .replace(/{BLOG-POST-LIST}/g, postListMarkup.join(``));
    fs.writeFileSync(`${__dirname}/index.html`, indexTemplate);
}


// Yesterday is history, tomorrow is a mystery, but today is a gift.
compile(`content`, `stories`, `.ignore`);
