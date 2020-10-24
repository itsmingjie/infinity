const solveBtn = document.getElementById('solveButton')
const solutionBox = document.getElementById('solution')

const solve = (e) => {
  e.preventDefault()
  const csrfToken = document.getElementById('csrfToken').value
  const solution = solutionBox.value

  console.log(
    JSON.stringify({
      solution
    })
  )

  fetch(`/game/puzzle/${PUZZLE_ID}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      solution
    })
  })
    .then((response) => response.json())
    .then((res) => {
      if (res.success) {
        Swal.fire('Correct!', res.message, 'success')
        document.getElementById(
          'solve-wrapper'
        ).innerHTML = `<p>${res.message}</p>`
        document.getElementById('solve-article').classList.add('is-success')
      } else {
        Swal.fire('Incorrect!', res.message, 'error')
        solutionBox.value = ''
      }
    })
    .catch((err) => {
      console.log(err)
    })
}

solveBtn.addEventListener('click', solve)
