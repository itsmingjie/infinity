# Infinity ∞

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

<a href="https://integirls.org"><img align="right" width="250" src="docs/logo.png" title="inteGIRLS Logo"></a>

Infinity ∞ is a puzzle hunt server written for [inteGIRLS](https://www.integirls.org).

Please contact [tech@integirls.org](mailto:tech@integirls.org) before reusing this software for a large competition. We may be able to help.

## Tech Stack

These are the technologies and libraries used to make Infinity possible. If you are willing to contribute to this project, it's suggested that you have a basic understanding of most of the tools used.

**Languages Used**: JavaScript used with [Node.js](https://nodejs.org/) for most of the logic, HTML + Sass/Scss to build and style the pages, and [pgSQL](https://www.postgresql.org/docs/12/plpgsql.html) to work around the database.

**Front-End Rendering**: [Handlebars.js](https://handlebarsjs.com/) for templating, and [Bulma](https://bulma.io/) for easy flexbox & responsiveness.

**Back-End Serving**: [Express.js](https://expressjs.com/) for routing, and [Passport.js](http://www.passportjs.org/) as local authentication middleware,.

**Storage**: [PostgreSQL](https://www.postgresql.org/) as main database interfaced with [node-postgres](https://node-postgres.com/), [Redis](https://redis.io/) for key-value persistent storage, and [Airtable API](https://airtable.com/api) for static content storage (puzzles). Some data is cached directly in memory to preserve database I/O.

This is not a "perfect" solution, but Infinity is designed with ease of deployment and management in mind. I wanted it to become a platform that everyone, whether you are technical or not, can deploy within minutes to start hosting their own puzzle hunt competition.

## Development

1. Clone this repo.
1. Create `.env` with the following configurations:
   - `DB_URI`: The PostgreSQL Connection URI.
   - `PORT`: The port the application should run on. Default `3000`.
   - `AIRTABLE_KEY`: API Key from Airtable.
   - `AIRTABLE_BASE`: Base ID from Airtable, where the problems and solutions are stored.
1. Start the initialized PostgreSQL server `service postgresql start`.
   - WIP: Queries to initialize the database will be added in a later update, once all the structures are set in.
1. Start application with `yarn start`.

## Deployment

This system is not 100% resource efficient, which means in production (especially during live competitions), it depends on automatic scaling of the deployment platforms to stay up. It is suggested that this server should be deployed on [Google App Engine](https://cloud.google.com/appengine) for production.

A few deployment tips, courtesy of the Puzzle Potluck team:

- Deploy the PostgreSQL server separately using a [Cloud SQL instance](https://cloud.google.com/sql/docs/postgres/connect-app-engine-standard).
- Be aware of the [connection limits](https://cloud.google.com/sql/docs/postgres/quotas#cloud-sql-for-postgresql-connection-limits) of the deployed instance. When scaling up the instance group for the verification server, be sure to set the maximum number of instances allowed to be below the database connection limits, or else the instance group could be thrown into an error loop.

When developing, be sure to reduce the amount of unnecessary database i/o to improve efficiency of the system.

## Bug Reporting

Bug reporting is always welcome!

For issues that are **not security-related** (does not impact data integrity, competition fairness, etc.), please simply create an [issue](/issues/new) in the GitHub Repository.

For **security-related issues**, please directly contact [tech@integirls.org](mailto:tech@integirls.org). Please be aware that any attempt to gain an unfair advantage during a live competition may disqualify you from the event at the organizer's discretion. If you accidentally discovered a security flaw during a competition and would like to retrace it, please follow the deployment guide to create a local instance instead of testing it in production.

Do not attempt to access an account you didn't create, data related to people other than yourself, or teams that you do not belong in. Do not perform any attack that could harm the integrity of our data. Don't perform any attack which could interfere with others' use of the platform. Do not publicly disclose a security-related bug before it has been patched.

---

## Credits

Special thanks to [Puzzle Potluck](https://puzzlepotluck.com/)'s @jeevnayak for providing guidiance on designing this platform.

## License

Copyright (c) 2020 Mingjie Jiang ([@itsmingjie](https://github.com/itsmingjie)). Commissioned by [inteGIRLS](https://integirls.org), a 501(c)(3) non-profit organization and released under MIT License. See [LICENSE](LICENSE) for details.

In addition to the MIT Licensed distribution, we ask that you credit [inteGIRLS] and link to this repository when reusing/redistributing this software. If you are interested in supporting the organization, please contact [info@integirls.org](mailto:info@integirls.org).
