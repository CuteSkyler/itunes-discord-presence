let client = new (require('discord-rpc-revamp').Client)();
client.connect({ clientId: '915309212463140865' }).catch(console.error);
let iTunesLogo = 'https://logodownload.org/wp-content/uploads/2018/09/itunes-logo-3.png';
const { request } = require('https');

var iTunes = require('itunes-bridge');
var currentTrack = iTunes.getCurrentTrack();
var iTunesEmitter = iTunes.emitter;

client.on('ready', ()=>{

    switch(currentTrack.playerState){
        case "playing": {
            setTheActivity(3, currentTrack);
            break;
        }
        case "paused": {
            setTheActivity(2, currentTrack);
            break;
        }
        case "stopped": {
            setTheActivity(1);
            break;
        }
    };
    
    iTunesEmitter.on('playing', function(type, currentTrack){
        if(type === "player_state_change") {
            setTheActivity(3, currentTrack);
        }else if(type === 'new_track'){
            setTheActivity(3, currentTrack);
        }
    });
    
    iTunesEmitter.on('paused', function(type, currentTrack){
        setTheActivity(2, currentTrack);
    });
    
    iTunesEmitter.on('stopped', function(){
        setTheActivity(1);
    });
});

async function setTheActivity(stopped, currentTrackb){
    let endtime = Date.now() + currentTrackb.remainingTime * 1000 || Date.now();
    
    switch(stopped){
        case 1: {
            client.setActivity({
                details: "Not playing...",
                state: "...waiting for the next tune.",
                startTimestamp: Date.now(),
                endTimestamp: Date.now(),
                largeImageKey: iTunesLogo,
                smallImageKey: iTunesLogo
            }).then(() => console.log('set activity'))
            .catch(console.error);
            client.subscribe('ACTIVITY_JOIN');
            client.subscribe('ACTIVITY_JOIN_REQUEST');
            client.on('ACTIVITY_JOIN', data => {
                console.log('ACTIVITY_JOIN', data);
            });
            return;
        };
        case 2: {
            fetchAlbum(`${currentTrackb.artist} ${currentTrackb.name} ${currentTrackb.album}`).then(output => {
                client.setActivity({
                    details: `Pasued; ${currentTrackb.name}`,
                    state: `by: ${currentTrackb.artist}`,
                    startTimestamp: Date.now(),
                    endTimestamp: Date.now(),

                    largeImageKey: output.artWorkUrl100,
                    smallImageKey: iTunesLogo,

                    buttons: [
                        { label: "Listen on iTunes", url: `itms://music.apple.com/us/album/${output.collectionId}` }
                    ]
                }).then(() => console.log('set activity'))
                .catch(console.error);
                client.subscribe('ACTIVITY_JOIN');
                client.subscribe('ACTIVITY_JOIN_REQUEST');
                client.on('ACTIVITY_JOIN', data => {
                    console.log('ACTIVITY_JOIN', data);
                });
                return;
            });
        };
        case 3: {
            console.log(currentTrackb);
            fetchAlbum(`${currentTrackb.name} ${currentTrackb.album}`).then(output => {
                console.log(output);
                client.setActivity({
                    details: currentTrackb.name,
                    state: `by ${currentTrackb.artist}`,
                    startTimestamp: Date.now(),
                    endTimestamp: endtime,

                    largeImageKey: output.artworkUrl100 || output.artworkUrl60 || output.artworkUrl30 || iTunesLogo,
                    // smallImageKey: iTunesLogo,

                    buttons: [
                        { label: "Listen on iTunes", url: `itms://music.apple.com/us/album/${output.collectionId}` }
                    ]
                }).then(() => console.log('set activity'))
                .catch(console.error);
                client.subscribe('ACTIVITY_JOIN');
                client.subscribe('ACTIVITY_JOIN_REQUEST');
                client.on('ACTIVITY_JOIN', data => {
                    console.log('ACTIVITY_JOIN', data);
                });
                return;
            });
        };
    };
};

async function fetchAlbum(query){
    let response = await new Promise((resolve, reject) => {
        let req = request('https://itunes.apple.com/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }, res => {
            let data = '';
            res.on('end', _ => resolve(JSON.parse(data)));
            res.on('data', chunk => data += chunk);
        }).on('error', _ => reject())
        req.write(new URLSearchParams({
            country: 'US',
            term: query
        }).toString())
        req.end();
    });
    return response.results[0];
};