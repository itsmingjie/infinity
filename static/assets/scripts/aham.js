// there's nothing here to see...
const ham_url =
  'aHR0cHM6Ly9naXN0LmdpdGh1YnVzZXJjb250ZW50LmNvbS9pdHNtaW5namllLzUzNmJiOGYxZmUwN2YzZmE5MGZlNDVmNWY5MTdiMmEwL3Jhdy8wMTlmNWUwYTQxNmVlMTBjZTk0ZGZhM2E5MjMzYzdlNDVlZjBkYTVlL2FoLnR4dA=='
console.log(
  'Ladies and gentlemen, you could have been anywhere in the world tonight...'
)
console.log("But you're here with us...")
console.log('Try a command? (Headphones Recommended)')
console.log('Hint: The command is in the format of ?.???()')

const a = {
  ham: () => {
    const ham = new Audio(
      atob(
        'aHR0cHM6Ly9pYTgwMzIwNy51cy5hcmNoaXZlLm9yZy8yNy9pdGVtcy9IYW1pbHRvbk11c2ljYWwvMS0wMSUyMEFsZXhhbmRlciUyMEhhbWlsdG9uLm1wMw=='
      )
    )

    const wall = document.getElementById('landing-wall')
    wall.style.background =
      "url('https://wallpaperaccess.com/full/1162781.jpg')"

    fetch(atob(ham_url)).then((response) => {
      response.text().then((text) => {
        const splitted = text.split('\n')
        let line = 0

        // in for a treat?
        ham.play()

        setInterval(() => {
          document.querySelector('.landing-titles .title').innerHTML =
            splitted[line]
          line++
        }, 3750)
      })
    })

    return 'Ladies and Gentlemen, welcome to the show.'
  }
}
