const solveBtn = document.getElementById('solveButton')
const solutionBox = document.getElementById('solution')

const solve = (e) => {
  e.preventDefault()
  const csrfToken = document.getElementById('csrfToken').value
  const solution = solutionBox.value

  if (solution == null || solution === '') return
  else if (
    /[1234567890~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?  \t]/g.test(solution)
  ) {
    Swal.fire(
      'Invalid Solution!',
      'Solutions can only contain letters. Please try again!',
      'error'
    )
    solutionBox.value = ''
    return
  }

  fetch(`/game/puzzle/${PUZZLE_ID}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      solution: solution.trim()
    })
  })
    .then((response) => {
      if (response.status === 429) {
        // rate limited!
        Swal.fire(
          'Whoa, slow down!',
          'You are having a little too much fun! Only 10 attempts per minute per team is allowed.',
          'error'
        ).then((res) => {
          window.location.reload()
        })
        throw new Error('Too many requests!')
      } else if (response.status === 500) {
        Swal.fire(
          'Server Error!',
          "This is most likely our fault, but our server didn't respond as expected. Please try again in a little bit.",
          'error'
        ).then((res) => {
          window.location.reload()
        })
        throw new Error('Server error!')
      } else if (response.status !== 200) {
        Swal.fire(
          'Error!',
          "You've triggered Mr. RoboCop, who is here to oversee score operations. Your teammates may be trying to solve at the same time as you! Please try again.",
          'error'
        ).then((res) => {
          window.location.reload()
        })
        throw new Error('Data racing protection!')
      }
      return response.json()
    })
    .then((res) => {
      if (res.success) {
        Swal.fire({
          icon: 'success',
          html: res.message,
          title: 'Correct!',
          footer: '[Reference: ' + res.reference + ' — share this with us if you think this is an error]'
        })
        document.getElementById(
          'solve-wrapper'
        ).innerHTML = `<p>${res.message}</p>`
        document.getElementById('solve-article').classList.add('is-success')
        document.getElementById('hints').style.display = 'none'
      } else {
        Swal.fire({
          icon: 'error',
          html: res.message,
          title: 'Incorrect!',
          footer: '[Reference: ' + res.reference + ' — share this with us if you think this is an error]',
          showDenyButton: true,
          denyButtonText: 'Stuck?',
          showConfirmButton: true,
          confirmButtonText: 'Retry!'
        }).then((result) => {
          if (result.isDenied) {
            window.location.href="/page/stuck"
          }
        })
        solutionBox.value = ''
      }
    })
    .catch((err) => {
      console.log(err)
    })
}

solveBtn.addEventListener('click', solve)
