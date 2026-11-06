import Konva from "konva";
import { setup, createActor } from "xstate";

const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const layer = new Konva.Layer();
stage.add(layer);

const MAX_POINTS = 10;
let polyline; // La polyline en cours de construction

const polylineMachine = setup({
    // Quelques actions et gardes que vous pouvez utiliser dans votre machine
    actions: {
        // Créer une nouvelle polyline
        createLine: () => {
            const pos = stage.getPointerPosition();
            polyline = new Konva.Line({
                points: [pos.x, pos.y, pos.x, pos.y],
                stroke: "red",
                strokeWidth: 2,
            });
            layer.add(polyline);
        },
        // Mettre à jour le dernier point (provisoire) de la polyline
        setLastPoint: () => {
            const pos = stage.getPointerPosition();
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;

            const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
            polyline.points(newPoints.concat([pos.x, pos.y]));
            layer.batchDraw();
        },
        // Enregistrer la polyline
        saveLine: () => {
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;
            // Le dernier point(provisoire) ne fait pas partie de la polyline
            const newPoints = currentPoints.slice(0, size - 2);
            polyline.points(newPoints);
            layer.batchDraw();
        },
        // Ajouter un point à la polyline
        addPoint: () => {
            const pos = stage.getPointerPosition();
            const currentPoints = polyline.points(); // Get the current points of the line
            const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
            polyline.points(newPoints); // Set the updated points to the line
            layer.batchDraw(); // Redraw the layer to reflect the changes
        },
        // Abandonner le tracé de la polyline
       abandon: () => {
        polyline.destroy();
     polyline = null;
},
        // Supprimer le dernier point de la polyline
        removeLastPoint: () => {
            const currentPoints = polyline.points(); // Get the current points of the line
            const size = currentPoints.length;
            const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
            const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
            polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
            layer.batchDraw(); // Redraw the layer to reflect the changes
        },
    },
    guards: {
        // On peut encore ajouter un point
        pasPlein: () => {
            // Retourner vrai si la polyline a moins de 10 points
            // attention : dans le tableau de points, chaque point est représenté par 2 valeurs (coordonnées x et y)
                return polyline.points().length / 2 < MAX_POINTS;
        },
        // On peut enlever un point
        plusDeDeuxPoints: () => {
            // Deux coordonnées pour chaque point, plus le point provisoire
            return polyline.points().length > 6;
        },
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiACwBGABxEATADYNAVl0bVGgMxbVi0wBoQmRMq0BOIroeuHZ4wHYNhnQF8-azQsPEIiCAAnAEMAdwIoanpmWgA1Jn4hJBA0MUlpWQUEZT4NIlNVTy1dVVVdYuNja1sEDU9lIjdXY2VlXS0tU0UAoIwcAmJI2PjExlYObgzZHIkpGSzCrT5NRU7vVT5dY1UqprtKoi0d12rVY30LYezR0InouPwEgCEogGMAa1gyF+YEWWWWeTWoA2RD4sNhykU-Vqum8ylOCAAtA4to5XKoHHpjA5VPYhoEniFxuE3tMmPhxGAIqCRLlVgUlCoiPjlJ4DnxEQ4UfZ0XVSn1+opKg5FOZPMZHsExmFJu8EkxYD8osgQYIlqIVvl1ohjBonDpdCV+p5jv1lI0bIhtIoOldpXxHA1VAFyfhUBA4HrKYQ9azDVDEBjOZ1iYduopFIZ0RieZ4Om4avZlKb+RoFc8qaRyCGDZD5Ihqjis-ozPsDLpFOjs2VPFdjtLDNU80HXlMPsWIeyilmXdUdgYKvj4+jJe1DCbBSYXHx9mSRt2iIQYgACWDiKIMrfKftso0IO5lRSj+x8dzFPiVEXVZy3YzxgmXwXy71AA */
    id: "polyLine",
    initial: "idle",
    states: {
        idle: {
            on: {
                MOUSECLICK: {
                    target: "drawing",
                    actions: ["createLine"],
                },
            },
        },

        drawing: {
            on: {
                MOUSEMOVE: {
                    actions: ["setLastPoint"],
                },

                MOUSECLICK: {
                    guard: "pasPlein",
                    actions: ["addPoint"],
                },

                Backspace: {
                    guard: "plusDeDeuxPoints",
                    actions: ["removeLastPoint"],
                },

                Enter: {
                    guard: "auMoinsDeuxPoints",
                    target: "idle",
                    actions: ["saveLine"],
                },

                Escape: {
                    target: "idle",
                    actions: ["abandon"],
                }
            },
        },

        "new state 1": {}
    },
});

// On démarre la machine
const polylineActor = createActor(polylineMachine);
polylineActor.subscribe((snapshot) => {
    console.log("Current state:", snapshot.value);
});
polylineActor.start();

// On envoie les événements à la machine
stage.on("click", () => {
    polylineActor.send({ type: "MOUSECLICK" });
});

stage.on("mousemove", () => {
    polylineActor.send({ type: "MOUSEMOVE" });
});

// Envoi des touches clavier à la machine
window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    // Enverra "a", "b", "c", "Escape", "Backspace", "Enter"... à la machine
    polylineActor.send({ type: event.key });
});
