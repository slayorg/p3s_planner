import Konva from "konva";

interface ArenaObjectConfig{
    opacity?: number;
    fill?: string;
    draggable?: boolean;
}

function getDistance(a: ArenaObject, b: ArenaObject){
    return Math.sqrt(((a.x-b.x)**2) + ((a.y-b.y)**2));
}

abstract class ArenaObject{
    x: number = 0;
    y: number = 0;
    scale: number = 1;
    tags: string[] = [];

    draggable = false;

    abstract shape: Konva.Shape;

    constructor(tags?: string[]){
        if(tags){
            this.tags = tags;
        }
    }

    setPosition(x: number, y: number){
        this.x = Math.round(x*100)/100;
        this.y = Math.round(y*100)/100;
        this.shape.position({
            x: this.x * this.scale,
            y: this.y * this.scale
        });
    }

    setScale(scale: number){
        this.scale = scale;
        this.setPosition(this.x, this.y);
    }

    setTags(tags?:string[]){
        if(tags){
            this.tags = tags;
        }
    }

    inMarker(obj: ArenaObject){
        return false;
    }

    dragEnd = () => {};

    setDraggable(){
        this.draggable = true;
        this.shape.draggable(true);
        this.shape.on("dragend", () => {
            this.setPosition(
                this.shape.x() / this.scale,
                this.shape.y() / this.scale
            );
            this.dragEnd();
        });
    }
}

export class CircleMarker extends ArenaObject{
    shape: Konva.Circle;
    radius: number;

    constructor( radius: number, x: number, y: number, config: ArenaObjectConfig, tags?: string[]){
        super(tags);
        this.radius = radius;
        this.shape = new Konva.Circle({
            ...config,
            radius: radius * this.scale
        });
        this.setPosition(x, y);
        if(config.draggable){
            this.setDraggable();
        }
    }

    setScale(scale: number): void {
        super.setScale(scale);
        this.shape.radius(this.radius * this.scale);
    }

    inMarker(obj: ArenaObject): boolean{
        return getDistance(obj, this) <= this.radius
    }
}

export class ConeMarker extends ArenaObject{
    shape: Konva.Line;
    coneAngle: number;
    size: number;
    angle: number;

    constructor(x: number, y: number, coneAngle: number, size: number, config: ArenaObjectConfig, tags?: string[]){
        super(tags);
        this.size = size;
        this.coneAngle = coneAngle;
        this.angle = 0;
        this.shape = new Konva.Line({
            ...config,
            closed: true,
        });
        this.setPosition(x, y);
    }

    setScale(scale: number): void {
        super.setScale(scale);
        this.shape.points([
            Math.sin(this.coneAngle/2) * (this.size*2*this.scale),
            Math.cos(this.coneAngle/2) * (this.size*2*this.scale),
            0, 0,
            Math.sin(-this.coneAngle/2) * (this.size*2*this.scale),
            Math.cos(-this.coneAngle/2) * (this.size*2*this.scale)
        ]);
    }

    pointAt(target: ArenaObject){
        const angle = Math.atan2(this.y - target.y, this.x - target.x);
        this.setRotation(angle);
    }

    setRotation(angle: number){
        this.angle = angle;
        this.shape.rotation((angle * 180 / Math.PI)+90);
    }

    inMarker(obj: ArenaObject): boolean{
        const angle = Math.atan2(this.y - obj.y, this.x - obj.x);

        const difference = Math.PI - Math.abs(Math.abs((angle+Math.PI) - (this.angle+Math.PI)) - Math.PI);

        return difference < (this.coneAngle/2);
    }
}

export class Arena{
    scaleMultiplier: number = 1;
    stageWidth: number = 20;

    group: Konva.Group;

    arenaObjects: ArenaObject[] = [];
    arenaObjectTags: Record<string, ArenaObject[]> = {};

    constructor(){
        this.group = new Konva.Group();
    }

    addObject(arenaObject: ArenaObject){
        arenaObject.setScale(this.scaleMultiplier);
        this.group.add(arenaObject.shape);
        this.arenaObjects.push(arenaObject);

        arenaObject.tags.forEach(tag => {
            if(!this.arenaObjectTags[tag]){
                this.arenaObjectTags[tag] = [];
            }
            this.arenaObjectTags[tag].push(arenaObject);
        });

        if(arenaObject.draggable){
            arenaObject.dragEnd = () => {
                this.onUpdate();
            }
        }
    }

    getByTag(tags: string[], count: number = -1){
        const results: ArenaObject[] = [];
        for(let i=0; i<tags.length; i++){
            const tag = tags[i];
            if(this.arenaObjectTags[tag]){
                results.push(...this.arenaObjectTags[tag]);
            }
        }
        return results.filter((item, pos, arr) => {
            return arr.indexOf(item) === pos;
        });
    }

    getClosest(target: ArenaObject, tags: string[]){
        let objs = this.getByTag(tags);
        objs = objs.sort((a, b) => {
            const dist = getDistance(target, a) - getDistance(target, b);
            return dist;
        });
        return objs;
    }

    setWidth(width: number){
        this.scaleMultiplier = width / this.stageWidth;
        this.arenaObjects.forEach(obj => {
            obj.setScale(this.scaleMultiplier);
        });
    }

    onUpdate = () => {};
}