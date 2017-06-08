# goodinternet-cli
Command line interface to blog to goodinternet

## Setup and Installation

Add your DatoCMS Write Token and Netlify Deploy Hook to your profile by adding the lines:
```
DATOCMS_READ_WRITE=XXXXXXXXX
NETLIFY_DEPLOY_HOOK=https://api.netlify.com/build_hooks/XXXXXXXXXXX
```

Clone the good-internet-cli repo

Run `yarn install` or `npm install` to install all dependencies

Run `npm link` to link to global node modules

## Usage

Run the command `goodinternet` with two parameters, `<url>` and `<description>`, for example:
```
> goodinternet http://example.com "A great minimal execution of a simple idea"
```

This will set off the following:
- Take screenshots of the url provided at both desktop and mobile resolution
- Push the screenshots, title, url and description as a new record to DatoCMS
- Set off a new deployment via Netlify

http://goodinternet.online has now been updated with your latest website.
