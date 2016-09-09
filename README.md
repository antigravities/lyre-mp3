# lyre
A web frontend to youtube-dl -x, similar to those youtube-to-mp3 sites. Written
back in 2014 and found/restored in 2016.

## Install
lyre makes many assumptions, including that you've installed youtube-dl correctly
on the host machine (and it's in your PATH) and that you've installed the included
youtube-dl.conf file in one of the locations specified
[here](https://github.com/rg3/youtube-dl/blob/master/README.md#configuration).

Once you've done those things, `node index.js` is what you need to do. Then,
connect to http://localhost:3333/ and voila, it should be self-explanatory from
there.

### Note
It is not recommended to run lyre in a production environment or facing the Internet.
It was mainly a small project for me, and security wasn't a huge concern when
I wrote this.

## License
[GPL v3](https://www.gnu.org/licenses/gpl-3.0.en.html)
