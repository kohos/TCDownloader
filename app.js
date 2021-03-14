const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const WebSocket = require('ws');

(async function() {
  if (process.argv.length < 3) return;
  const userId = process.argv[2];
  const password = (process.argv.length < 4) ? null : process.argv[3];
  let id = null;
  let interval = 4000;
  let func = null;
  func = async function() {
    let data = null;
    while (true) {
      try {
        data = await checkOnline(userId, password);
        break;
      } catch(e) {
        console.log(e);
      }
    }
    if (data.live) {
      if (data.id != id) {
        id = data.id;
        const streamUrl = await getStreamUrl(userId, password);
        console.log(`${now()} DOWNLOAD START ${userId}_${id}.ts`);
        download(streamUrl, userId, path.join(__dirname, `${userId}_${id}_${Date.now()}.ts`));
      }
    } else {
      // console.log(`${now()} OFFLINE ${userId}`);
    }
    interval = data.interval * 1000;
    setTimeout(func, interval);
  };
  setTimeout(func, interval);
})().catch(err => console.log(`${now()} ${err.message}`));

async function checkOnline(userId, password) {
  let url = `https://frontendapi.twitcasting.tv/users/${userId}/latest-movie`;
  if (password) {
    url += '?pass=' + md5(password);
  }
  const data = await (await fetch(url)).json();
  if (!data || !data.movie) return { live: false };
  return { live: data.movie.is_on_live, id: data.movie.id, interval: data.update_interval_sec };
}

async function getStreamUrl(userId, password) {
  const data = await (await fetch(`https://twitcasting.tv/streamserver.php?target=${userId}&mode=client`)).json();
  if (!data || !data.movie || !data.fmp4) throw new Error('NO_INFO_ERROR');
  if (!data.movie.live) throw new Error('NO_LIVE_ERROR');
  const proto = data.fmp4.proto;
  const host = data.fmp4.host;
  const mode = data.fmp4.source ? 'main' : data.fmp4.mobilesource ? 'mobilesource' : 'base';
  const movieId = data.movie.id;
  if (!proto || !host || !movieId) throw new Error('NO_STREAM_ERROR');
  let movieUrl = `${proto}://${host}/ws.app/stream/${movieId}/fmp4/bd/1/1500?mode=${mode}`;
  if (data.llfmp4 && data.llfmp4.streams && data.llfmp4.streams.main) {
    movieUrl = data.llfmp4.streams.main;
  }
  if (movieUrl && password) {
    movieUrl += (movieUrl.indexOf('?') === -1) ? '?' : '&';
    movieUrl += 'word=' + md5(password);
  }
  return movieUrl;
}

function download(streamUrl, userId, filePath) {
  const ws = new WebSocket(streamUrl, { origin: `https://twitcasting.tv/${userId}` });
  const duplex = WebSocket.createWebSocketStream(ws);
  const stream = fs.createWriteStream(filePath);
  duplex.pipe(stream);
}

function now() {
  return new Date().toLocaleString('ja', { timeZone: 'Japan' });
}

function md5(text) {
  return crypto.createHash('md5').update(text).digest("hex");
}

