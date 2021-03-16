# TCDownloader
Script for download TwitCasting lives. support lives with password

# Usage
Use this script in command line.

First clone this code.

``
git clone https://github.com/kohos/TCDownloader
``

Change directory.

``
cd TCDownloader
``

Start monitor and download. tcid is required, password is optional.

``
node app.js <tcid> [password]
``

Download filename is <tcid>_<liveid>_<time>.ts

Can use ffmpeg to convert ts to mp4

``
ffmpeg -i <tsfile> -codec copy <mp4file>
``

Can use pm2 to support long time auto monior and download.
