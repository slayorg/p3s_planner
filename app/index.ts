import Konva from "konva";

import { Arena, CircleMarker, ConeMarker } from "./arena";

const stage = new Konva.Stage({
    container: "container",
    width: 500,
    height: 500
});

const layer = new Konva.Layer();
const group = new Konva.Group({
    x: stage.width()/2,
    y: stage.height()/2
});
layer.add(group);

const arena = new Arena();

group.add(arena.group);
stage.add(layer);

arena.setWidth(stage.width());

arena.addObject( new CircleMarker(10, 0, 0, {fill: "grey"}));
arena.addObject( new CircleMarker(3, 0, 0, { fill: "black", opacity: 0.5 }, ["boss"]));

for(let i=0; i<3; i++){
    const angle = Math.PI*2/3*i;
    arena.addObject(new CircleMarker(
        2,
        Math.sin(Math.PI+ angle) * ((arena.stageWidth/2) - 2),
        Math.cos(Math.PI+ angle) * ((arena.stageWidth/2) - 2),
        {
            fill: "red",
            opacity: 1
        },
        ["tornado", "damage", "kill"]
    ));
    console.log("add tornaod");
}

arena.getByTag(["boss"]).forEach(boss => {
    for(let i=0; i<3; i++){
        arena.addObject(new ConeMarker(boss.x, boss.y, Math.PI*2/6, arena.stageWidth*2,
            {
                fill: "orange",
                opacity: 0.5
            },
            ["bosscone", "damage"]
        ));
    }

});

arena.getByTag(["tornado"]).forEach(tornado => {
    arena.addObject(new ConeMarker(tornado.x, tornado.y, Math.PI*2/6, arena.stageWidth*2,
        {fill: "orange", opacity: 0.5},
        ["tornadocone", "damage"]
    ));
});

for(let i=0; i<2; i++){
    arena.addObject(new CircleMarker(3, 0, 0, {
        fill: "orange",
        opacity: 0.5
    }, ["tanktether", "damage"]));
}



for(let i=0; i<2; i++){
    arena.addObject(new CircleMarker(0.5, 0, 0, {fill: "blue", draggable: true}, ["player", "tank"]));
}

for(let i=0; i<2; i++){
    arena.addObject(new CircleMarker(0.5, 5, 5, {fill: "green", draggable: true}, ["player", "healer"]));
}
for(let i=0; i<4; i++){
    arena.addObject(new CircleMarker(0.5, 5, 0, {fill: "red",  draggable: true}, ["player", "dps"]));
}

arena.onUpdate = () => {
    const boss = arena.getByTag(["boss"])[0];
    const bossTargets = arena.getClosest(boss, ["player"]);
    arena.getByTag(["bosscone"]).forEach((cone, index) => {
        const target = bossTargets[index];
        if(target){
            (cone as ConeMarker).pointAt(target);
        }
    });

    arena.getByTag(["tornadocone"]).forEach((cone, index) => {
        const target = arena.getClosest(cone, ["player"])[0];
        if(target){
            (cone as ConeMarker).pointAt(target);
        }
    });

    const tanks = arena.getByTag(["tank"]);
    arena.getByTag(["tanktether"]).forEach((aoe, index) => {
        aoe.setPosition(tanks[index].x, tanks[index].y);
    });


    const damageMarkers = arena.getByTag(["damage"]);
    const players = arena.getByTag(["player"]) as CircleMarker[];
    const playerHits: number[] = new Array(players.length).fill(0);
    console.log(playerHits);
    damageMarkers.forEach(aoe => {
        players.forEach((player, pindex) => {
            if(aoe.inMarker(player)){
                playerHits[pindex]++;
            }
        });
    });
    playerHits.forEach((hitCount, index) => {
        const player = players[index];
        if(hitCount > 1){
            player.shape.stroke("magenta");
        } else {
            player.shape.stroke("none");
        }
    });

    const data: number[] = [];
    players.forEach(p => {
        data.push(p.x, p.y);
    });
    window.history.replaceState(null, "", "?data=" + data.join(","));
}

//arena.onUpdate();

function loadData(data: number[]){
    const players = arena.getByTag(["player"]);
    if(data && data.length === players.length*2){
        for(let i=0; i<players.length; i++){
            players[i].setPosition(data[i*2], data[i*2+1]);
        }
        arena.onUpdate();
    }
}

(() => {
    const strats = {
        "Elmo": [-2.2,3.96,1.98,3.86,-2.32,-6.04,-2.74,-4.86,-2.72,-6.88,-1.74,-5.1,2.76,-7.68,-3.66,-6.1],
        "Braindead": [-0.12,2.88,-0.14,2.58,-3.24,-7.8,3.86,-3.5,3.28,-3.08,2.82,-2.7,5.92,6.76,-5.98,6.14],
        "Fiesta": [-3.36,2.52,3.5,2.9,-6.2,6.52,6.9,6.38,-2.64,-8.84,0.02,1.66,-2.32,-1.48,1.94,-1.42],
        "Full Uptime": [-3.48,-1.24,3.34,-0.7,0.96,3.88,0.9,3.9,0.8,3.68,0.82,4.06,0.96,3.6,0.86,3.66],
        "Partial Uptime": [0.12,2.28,0.18,2.46,3.64,2,8.5,-4.22,3.4,1.68,-3.18,1.38,5.68,1.04,-3.02,5.46],
        "Kill Ri": [-2.04,3.48,2.42,3.34,-1.48,-3.32,2.1,-2.7,7.44,1.44,-2.46,-1.3,1.24,-9.72,-7.14,0.82],
        "Slay's Uptime": [-1.8,2.64,1.82,2.86,-3.68,-3.88,7.1,1.62,2.6,-0.84,-0.42,-2.26,1.4,-2.12,-2.58,6.78]
    };
    
    const buttonContainer = document.getElementById("buttons");
    
    const players = arena.getByTag(["player"]);
    for(const [key, value] of Object.entries(strats)){
        const btn = document.createElement("button");
        btn.innerText = key;
        btn.addEventListener("click", () => {
            loadData(value);
        });
        buttonContainer?.appendChild(btn);
    }

    const params = new URLSearchParams(location.search);
    const paramData = params.get("data");
    if(paramData){
        const values = paramData.split(",").map(v => parseFloat(v));
        if(values && values.length === players.length * 2){
            loadData(values);
        } else {
            loadData(strats.Fiesta);
        }
    }
})();

const hot = (module as any)?.hot;
if (hot) {
  hot.dispose(() => {
    window.location.reload();
    throw "hotReload";
  });
}
