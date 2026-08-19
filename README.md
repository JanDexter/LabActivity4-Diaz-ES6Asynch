# Post Manager

Lab Activity 4 - ES6+ & Asynchronous Data Handling

A small dashboard for browsing and managing posts, pulling live data from the
[JSONPlaceholder](https://jsonplaceholder.typicode.com/) API using plain
JavaScript. No frameworks and no build step.

## Running it

Open `index.html` in a browser. That's it — the data is fetched at page load,
so you just need an internet connection.

If you use VS Code, the Live Server extension also works.

## What it does

- Fetches `/posts` and `/users` at the same time, then matches each post to its
  author so the cards can show a name instead of a bare `userId`
- Search box that filters by title or body text
- Filter by author, and sort by newest or by title
- Counters at the top for total posts, unique authors, and average words per post
- Comments for a post are loaded from `/posts/:id/comments` only when you click
  the button, so the page isn't waiting on 100 extra requests at startup
- Create a post (POST) and delete one (DELETE)

## Files

| File | What's in it |
| --- | --- |
| `index.html` | Page structure |
| `style.css` | Styling |
| `script.js` | All the fetching, rendering and event handling |

## ES6+ features used

`const` / `let`, arrow functions, template literals, object and array
destructuring, the spread operator, object shorthand, default parameters, `Set`,
and the array methods `map`, `filter`, `find`, `sort` and `reduce`.

## How the rendering works

Cards and comment rows are built as template literal strings and dropped in with
`innerHTML`, but only ids and numbers are written into the markup that way. Every
piece of text that comes from the API or from the create form is set afterwards
with `textContent`, so a post titled `<img src=x onerror=...>` shows up as those
characters on screen instead of running. That is also why the card template has
empty `<h3>` and `<p>` elements that get filled in a second pass.

Buttons inside the list do not use `onclick`. They carry `data-action` and
`data-id`, and one click listener on the posts container handles all of them.
The list is rebuilt on every keystroke in the search box, and a single listener
on a container that never gets replaced means there is nothing to re-attach.

## Async handling

Everything that touches the network uses `async` / `await` with the Fetch API,
wrapped in `try` / `catch` / `finally`. The initial load uses `Promise.all` so
the posts and users requests go out together instead of one after the other.
Responses are checked with `response.ok` before being used, and any failure
shows a message on the page rather than only in the console.

## Note on saving

JSONPlaceholder is a fake API. It replies to POST and DELETE as if the change
worked, but nothing is actually stored on their side — refresh the page and the
original 100 posts come back. New posts are added to the local array so the UI
still updates the way it would against a real backend.

There is also no login anywhere in this project, and the API has no accounts to
log in to, so any post can be deleted regardless of who wrote it. In a real app
that check belongs on the server, which would compare the post's `userId` against
the signed-in user and refuse the request. Hiding a button in the browser is not
a security measure, so nothing here pretends otherwise.
