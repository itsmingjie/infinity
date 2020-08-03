# Infinity ∞

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)

<a href="https://integirls.org"><img align="right" width="250" src="docs/logo.png" title="inteGIRLS Logo"></a>

Infinity ∞ is a puzzle hunt server written for [inteGIRLS](https://www.integirls.org). It is written in Node.js & PostgreSQL.

Please contact me at [hi@mingjie.dev](mailto:hi@mingjie.dev) before reusing this software.

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

---

## Credits

Special thanks to [Puzzle Potluck](https://puzzlepotluck.com/)'s @jeevnayak for providing guidiance on designing this platform.

## License

Copyright (c) 2020 Mingjie Jiang (https://github.com/itsmingjie). Released under MIT License. See [LICENSE](LICENSE) for details.
