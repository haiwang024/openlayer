/**
 * 动态标绘API plot4ol3，基于OpenLayer3开发，旨在为基于开源GIS技术做项目开发提供标绘API。
 * 当前版本1.0，提供的功能：绘制基本标绘符号。
 * 绘制接口: PlotDraw
 * 编辑接口: PlotEdit 
 * 
 * */

var map, plotDraw, plotEdit, drawOverlay, drawStyle;
var source_bezier,vector_bezier 
var center = ol.proj.transform([100.1528940000, 37.6268660000], 'EPSG:4326', 'EPSG:3857');

function init() {
    /**
     * 自定义控件
     * **/
    //比例尺
    var scaleLine = new ol.control.ScaleLine({
        //设置比例尺单位，degrees、imperial、us、nautical、metric（度量单位）
        units: "metric"
    });
    //显示当前鼠标位置
    var mousePosition = new ol.control.MousePosition({
        projection: 'EPSG:4326',
        coordinateFormat: ol.coordinate.createStringXY(4)
    });

    // 初始化地图，底图使用openstreetmap在线地图
    map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                source: new ol.source.OSM() 
            })
        ],
        view: new ol.View({
            center: center,
            zoom: 7,
        }),
        controls: ol.control.defaults({
            zoom: false,///不显示放大放小按钮；
            rotate: false,//不显示指北针控件；
            attribution: false//不显示右下角的地图信息控件；
        }).extend([//自定义控件
            // scaleLine,//比例尺
            mousePosition//显示当前鼠标位置
        ])
    });

    map.on('click', function (e) {
        if (plotDraw.isDrawing()) {
            return;
        }
        var feature = map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
            return feature;
        });
        if (feature) {
            // 开始编辑
            plotEdit.activate(feature);
            activeDelBtn();
        } else {
            // 结束编辑
            plotEdit.deactivate();
            deactiveDelBtn();
        }
    });

    // 初始化标绘绘制工具，添加绘制结束事件响应
    plotDraw = new P.PlotDraw(map);
    plotDraw.on(P.Event.PlotDrawEvent.DRAW_END, onDrawEnd, false, this); 

    // 初始化标绘编辑工具
    plotEdit = new P.PlotEdit(map);

    // 设置标绘符号显示的默认样式
    var stroke = new ol.style.Stroke({
        color: '#FF0000',
        width: 2,
    });
    var fill = new ol.style.Fill({ color: 'rgba(3,247,21,.5)' });
    var image = new ol.style.Circle({ fill: fill, stroke: stroke, radius: 8 });
    drawStyle = new ol.style.Style({ image: image, fill: fill, stroke: stroke });
 
    // 添加一个绘制的线使用的layer
    drawOverlay = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: drawStyle
    }) 
    drawOverlay.setMap(map);  
    var source = drawOverlay.getSource()
    // console.log(source)
    map.addLayer(drawOverlay); 
 
    // var lineDraw = new ol.interaction.Draw({
    //     type: 'Polygon',
    //     source: source,    // 注意设置source，这样绘制好的线，就会添加到这个source里
    //     style: new ol.style.Style({            // 设置绘制时的样式
    //          stroke: new ol.style.Stroke({
    //             color: 'transparent',
    //             width: 2, 
    //         }) 
    //     }),  
    // });   
    // map.addInteraction(lineDraw);
 
    //删除
    get('btn-delete').onclick = function () {
        if (drawOverlay && plotEdit && plotEdit.activePlot) {
            drawOverlay.getSource().removeFeature(plotEdit.activePlot); 
            plotEdit.deactivate();
            deactiveDelBtn();
        }
    };
}

// 绘制结束后，添加到FeatureOverlay显示。
function onDrawEnd(event) {
    var feature = event.feature;
    drawOverlay.getSource().addFeature(feature);
    plotEdit.activate(feature);
    // 开始编辑 
    activeDelBtn();
}

// 指定标绘类型，开始绘制。
function activate(type) {
    plotEdit.deactivate();
    plotDraw.activate(type);  
};


function get(domId) {
    return document.getElementById(domId);
}

function activeDelBtn() {
    get('btn-delete').style.display = 'inline-block';
}

function deactiveDelBtn() {
    get('btn-delete').style.display = 'none';
}





//阶乘
function factorial(num) {
    if (num <= 1) {
        return 1;
    } else {
        return num * factorial(num - 1);
    }
}

/*
 * 生成贝塞尔曲线插值点
 * @para n {number} 控制点数量
 * @para arrPoints {array} 控制点坐标集合
 */
function createBezierCurvePoints(n, arrPoints) {
    var Ptx = 0;
    var Pty = 0;

    var arrbline = [];
    for (var t = 0; t < 1; t = t + 0.01) {
        Ptx = 0;
        Pty = 0;
        for (var i = 0; i <= n; i++) {
            Ptx += (factorial(n) / (factorial(i) * factorial(n - i))) * Math.pow((1 - t), n - i) * Math.pow(t, i) * arrPoints[i][0];
            Pty += (factorial(n) / (factorial(i) * factorial(n - i))) * Math.pow((1 - t), n - i) * Math.pow(t, i) * arrPoints[i][1];
        }

        arrbline.push([Ptx, Pty]);
    }
    return arrbline;
}

/******************创建线样式***************/
function createLineStyle(color, width, linecap, linejoin) {
    return new ol.style.Style({
        stroke: new ol.style.Stroke(({
            color: color,  //颜色
            width: width,  //宽度
            lineCap: linecap, 
            lineJoin: linejoin 
        }))
    });
}

/******************绘制线***************/
function createLine(lid, lx, arrCoordinate, style){
    var f = new ol.Feature({
        geometry: new ol.geom.LineString(arrCoordinate),
        id: lid,           //线的唯一标识
        lx: lx            //类型，区别于其它Features
    });
    f.setId(lid);  //不能删除
    f.setStyle(style);
    return f;
}

/******************在地图上标记一个点对象***************/
//随机生成当前范围内的一个经纬度坐标，用于在地图上标点
function randomPointJWD() {
    var topleftPoint = map.getCoordinateFromPixel([10, 10]);
    var centerPoint = map.getView().getCenter();
    var bottomrightPoint = [centerPoint[0] + (centerPoint[0] - topleftPoint[0]), centerPoint[1] + (centerPoint[1] - topleftPoint[1])];
    var jd = topleftPoint[0] + (bottomrightPoint[0] - topleftPoint[0]) * Math.random();
    var wd = bottomrightPoint[1] + (topleftPoint[1] - bottomrightPoint[1]) * Math.random();
    return [jd, wd];
}


/**************************绘制贝塞尔曲线*****************************/
function drawBezierCurve(n) {
    //n表示绘制贝塞尔曲线的阶数
    var arrPoints = [];
    for (var i = 0; i <= n; i++) {
        arrPoints.push(randomPointJWD());
    }
    var arrbline = createBezierCurvePoints(n, arrPoints);
    var style = createLineStyle("#ff2723", 4, 'round', 'round');
    var f = createLine("bezier_nj" + Math.random(), "bezier", arrbline, style);
    source_bezier.addFeature(f);
} 
function clearBezierCurve() {
    source_bezier.clear();
}