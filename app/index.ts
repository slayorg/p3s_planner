import Konva from "konva";
console.log("ready");

const hot = (module as any)?.hot;
if (hot) {
  hot.dispose(() => {
    window.location.reload();
    throw "hotReload";
  });
}

const earthlyStar = 10;

const stage = new Konva.Stage({
    container: "container",
    width: 500,
    height: 500
});

const layer = new Konva.Layer();

const scale = stage.width()/(earthlyStar*2);

const group = new Konva.Group({
    x: stage.width()/2,
    y: stage.height()/2,
    scale: {x: scale, y: scale}
});

const stageCircle = new Konva.Circle({ 
    radius: earthlyStar,
    fill: "grey"
});

const boss = new Konva.Circle({
    radius: 3,
    fill: "black",
    opacity: 0.5
});

group.add(stageCircle);
group.add(boss);


const tornados: Konva.Circle[] = [];

const tornadoCones: Konva.Line[] = [];

const angleInterval = Math.PI*2/3;

for(let i=0; i<3; i++){
    const tornado = new Konva.Circle({
        radius: 2,
        fill: "orange",
        x: Math.sin(Math.PI+ (angleInterval)*i) * (earthlyStar - 2),
        y: Math.cos(Math.PI+ (angleInterval)*i) * (earthlyStar - 2),
        opacity: 0.5
    });
    console.log("place tornado at ", tornado.position());
    group.add(tornado);
    tornados.push(tornado);

    const leftAngle = Math.PI*2/12;
    const rightAngle = -Math.PI*2/12;
    const tornadoCone = new Konva.Line({
        x: tornado.x(),
        y: tornado.y(),
        points: [
            Math.sin(leftAngle) * (earthlyStar*2),
            Math.cos(leftAngle) * (earthlyStar*2),
            0, 0,
            Math.sin(rightAngle) * (earthlyStar*2),
            Math.cos(rightAngle) * (earthlyStar*2)
        ],
        fill: "orange",
        closed: true,
        opacity: 0.5
    });
    group.add(tornadoCone);
    tornadoCones.push(tornadoCone);
}

const bossCones: Konva.Line[] = [];

for(let i=0; i<3; i++){
    const leftAngle = Math.PI*2/12;
    const rightAngle = -Math.PI*2/12;
    const line = new Konva.Line({
        points: [
            Math.sin(leftAngle) * (earthlyStar+2),
            Math.cos(leftAngle) * (earthlyStar+2),
            0, 0,
            Math.sin(rightAngle) * (earthlyStar+2),
            Math.cos(rightAngle) * (earthlyStar+2)
        ],
        fill: "orange",
        closed: true,
        opacity: 0.5
    });
    bossCones.push(line);
    group.add(line);
    console.log(line.points());
}

const tankCircles: Konva.Circle[] = [];

for(let i=0; i<2; i++){
    const circle = new Konva.Circle({
        radius: 3,
        fill: "orange",
        opacity: 0.5
    })
    group.add(circle);
    tankCircles.push(circle);
}




const tanks: Konva.Circle[] = [];

for(let i=0; i<2; i++){
    const tank = new Konva.Circle({
        radius: 0.5,
        fill: "blue",
        listening: true,
        draggable: true
    });
    group.add(tank);
    tanks.push(tank);
}

const healers: Konva.Circle[] = [];

for(let i=0; i<2; i++){
    const healer = new Konva.Circle({
        radius: 0.5,
        fill: "green",
        listening: true,
        draggable: true
    });
    group.add(healer);
    healers.push(healer);
}

const damages: Konva.Circle[] = [];
for(let i=0; i<4; i++){
    const dps = new Konva.Circle({
        radius: 0.5,
        fill: "red",
        listening: true,
        draggable: true
    });
   
    group.add(dps);
    damages.push(dps);
}

const players = [...tanks, ...healers, ...damages];

players.forEach((p, i)=> {
    const angle = ((Math.PI*2)/players.length)*i;
    p.position({
        x: Math.sin(angle) * earthlyStar/2,
        y: Math.cos(angle) * earthlyStar/2,
    });

    p.on("dragend", ev => {
        updateCones();
    });
});

function getDistance(a: {x:number, y: number}, b: {x: number, y: number}){
    return Math.sqrt(((a.x-b.x)**2) + ((a.y-b.y)**2));
}

function updateCones(){
    let targets = [...players];
    bossCones.forEach(cone => {
        let target: Konva.Circle = targets[0];
        let dist = getDistance(target.position(), boss.position());

        for(let i=1; i<targets.length; i++){
            const t= targets[i];
            const tDist = getDistance(t.position(), boss.position());
            if(tDist < dist){
                dist = tDist;
                target = t;
            }
        }

        const index = targets.indexOf(target);
        if(index !== -1){
            targets.splice(index, 1);
        }
        const angle = Math.atan2(target.y(), target.x()) - Math.atan2(boss.y(), boss.x());
        cone.rotation((angle * 180 / Math.PI)-90);
    });

    
    
    tornadoCones.forEach((cone, ci )=> {
        targets = [...players];
        let target: Konva.Circle = targets[0];
        let dist = getDistance(target.position(), cone.position());

        for(let i=1; i<targets.length; i++){
            const t= targets[i];
            const tDist = getDistance(t.position(), cone.position());
            if(tDist < dist){
                dist = tDist;
                target = t;
            }
        }
        const index = targets.indexOf(target);
        if(index !== -1){
            targets.splice(index, 1);
        }

        const angle = Math.atan2(cone.y() - target.y(), cone.x() - target.x());
        cone.rotation((angle * 180 / Math.PI)+90);
    });

    tanks.forEach((t, i) => {
        tankCircles[i].position(t.position());
    });

    console.log(JSON.stringify(players.map(p => ({x:p.x(), y:p.y()}))));
}


const strats = {
    elmo: [{"x":-2.200000000000001,"y":3.959999999999992},{"x":1.9755339059327315,"y":3.8555339059327345},{"x":-2.320000000000001,"y":-6.040000000000003},{"x":-2.744466094067267,"y":-4.855533905932732},{"x":-2.7200000000000024,"y":-6.88},{"x":-1.7355339059327357,"y":-5.095533905932734},{"x":2.7599999999999962,"y":-7.68},{"x":-3.6555339059327387,"y":-6.104466094067264}],
    braindead:[{"x":-0.120000000000001,"y":2.8799999999999883},{"x":-0.1444660940672695,"y":2.5755339059327316},{"x":-3.240000000000002,"y":-7.8000000000000025},{"x":3.8555339059327336,"y":-3.4955339059327324},{"x":3.2799999999999976,"y":-3.08},{"x":2.824466094067269,"y":-2.6955339059327343},{"x":5.919999999999993,"y":6.760000000000002},{"x":-5.97553390593274,"y":6.135533905932735}],
    fiesta: [{"x":-3.3599999999999994,"y":2.519999999999998},{"x":3.4955339059327346,"y":2.895533905932737},{"x":-6.2,"y":6.52},{"x":6.89553390593274,"y":6.3844660940672675},{"x":-2.6400000000000015,"y":-8.84},{"x":0.024466094067264077,"y":1.664466094067266},{"x":-2.3200000000000003,"y":-1.4800000000000004},{"x":1.94446609406726,"y":-1.424466094067264}]
};

const data = [{"x":-3.3599999999999994,"y":2.519999999999998},{"x":3.4955339059327346,"y":2.895533905932737},{"x":-6.2,"y":6.52},{"x":6.89553390593274,"y":6.3844660940672675},{"x":-2.6400000000000015,"y":-8.84},{"x":0.024466094067264077,"y":1.664466094067266},{"x":-2.3200000000000003,"y":-1.4800000000000004},{"x":1.94446609406726,"y":-1.424466094067264}];

data.forEach((d, i) => {
    players[i].position(d);
});


layer.add(group);
stage.add(layer);


updateCones();

const buttonContainer = document.getElementById("buttons");

for(const [key, value] of Object.entries(strats)){
    const btn = document.createElement("button");
    btn.innerText = key;
    btn.addEventListener("click", () => {
        value.forEach((d, i) => {
            players[i].position(d);
        });
        updateCones();
    });
    buttonContainer?.appendChild(btn);
}
