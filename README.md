# Infinity ∞

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

<a href="https://integirls.org"><img align="right" width="150" src="docs/logo.png" title="inteGIRLS Logo"></a>


Infinity ∞ is a puzzle hunt server written for [inteGIRLS](https://www.integirls.org). It is written in Node.js & MongoDB.

Please contact me at [hi@mingjie.dev](mailto:hi@mingjie.dev) before reusing this software.

## Development

1. Clone this repo.
1. Install [MongoDB](https://docs.mongodb.com/manual/installation/).
1. Create a directory at `./db` for MongoDB to store dev database.
1. Create `.env` with the following configurations:
    * `DB_URI`: The MongoDB Connection URI. Default `mongodb://localhost`
    * `PORT`: The port the application should run on. Default `3000`.
1. Start local database with `yarn db:start`.
1. Start application with `yarn start`.
1. Once finished, safely shutdown the local database with `yarn db:stop`. Database contents presists. 

---

## Credits

Special thanks to [Puzzle Potluck](https://puzzlepotluck.com/)'s @jeevnayak for providing guidiance on designing this platform. 

## License

Copyright (c) 2020 Mingjie Jiang (https://github.com/itsmingjie). Released under MIT License. See [LICENSE](LICENSE) for details.