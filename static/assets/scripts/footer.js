/* eslint-disable no-undef */
let statLoaded = false

document.getElementById('copyright').addEventListener('click', () => {
  if (!statLoaded) {
    fetch('https://api.github.com/repos/itsmingjie/infinity/commits') // Call the fetch function passing the url of the API as a parameter
      .then((d) => d.json())
      .then((data) => {
        document.getElementById('serverStat').innerHTML += `
                <strong>Last Update</strong>: ${new Date(
                  data[0].commit.committer.date
                ).toLocaleString('en-US')}<br />
                <strong>Git Commit</strong>: <a href="${
                  data[0].html_url
                }" target="blank">${data[0].sha.substring(
          0,
          7
        )}</a> by <a href="${data[0].committer.html_url}" target="blank">@${
          data[0].author.login
        }</a><br />
                <strong>Update</strong>: ${data[0].commit.message}<br />
                `
        statLoaded = true
      })

    fetch('https://api.github.com/repos/itsmingjie/infinity/deployments') // Call the fetch function passing the url of the API as a parameter
      .then((d) => d.json())
      .then((data) => {
        document.getElementById('serverStat').innerHTML += `
                <strong>Deployment</strong>: ${data[0].payload.web_url}<br />
                <strong>Up Since</strong>: ${new Date(
                  data[0].updated_at
                ).toLocaleString('en-US')}<br />
                `
        statLoaded = true
      })
  }

  document.getElementById('serverStat').classList.toggle('hidden')
})
