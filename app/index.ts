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
    container: "app",
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
    fill: "orange",
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
    const targets = [...players];
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
}

const data = [{"x":-3.5200000000000005,"y":3.200000000000001},{"x":3.5355339059327373,"y":3.5355339059327378},{"x":-6.2,"y":6.52},{"x":6.89553390593274,"y":6.3844660940672675},{"x":-2.3199999999999985,"y":-9.16},{"x":3.2644660940672643,"y":-1.2555339059327375},{"x":-2.92,"y":-1.7599999999999998},{"x":1.5444660940672614,"y":-2.9444660940672636}];

data.forEach((d, i) => {
    players[i].position(d);
});


layer.add(group);
stage.add(layer);


updateCones();