var iData = null;

$.ajax({
    url: './js/data.json',
    type: 'GET',
    dataType: 'JSON',
    success: function(data){
        iData = data;
        addMenu(data);
        for (let i = 0; i < data.length; i++) {
            const group = data[i];
            const schools = data[i].school;
            for (let j = 0; j < schools.length; j++) {
                const school = schools[j];
                createMarker(school,group);
            }
        }
    }
})

//定义行政区域
var city = '拱墅区';
//定义地图缩放比例
var iZoom = 13;
//移动端判断
let isMobile = /Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent);

if(isMobile) {
    iZoom = 12;
}else{
}
//地图初始化
var map = new AMap.Map('map',{
    viewMode: '3D',
    mapStyle: 'amap://styles/41a39c02dd4b24b03c1bc489534ccf10'
});

//地图插件使用
//AMap.DistrictSearch - 行政区域查询
AMap.plugin(['AMap.DistrictSearch','AMap.ToolBar'],function(){
    var district = new AMap.DistrictSearch({
        //查询等级 - country:国家, province:省, city:市, district:区/县, biz_area:商圈
        level: 'district',
        //返回行政区的坐标点集合 - 默认值:base:不返回坐标点, all:返回坐标点
        extensions: 'all'
    });
    //district.search() 根据关键字查询行政区或商圈信息
    district.search(city,function(status,result){
        var bounds = result.districtList[0].boundaries;
        var polygons = [];
        if(bounds){
            for (let i = 0; i < bounds.length; i++) {
                const boundsEle = bounds[i];
                var polygon = new AMap.Polygon({
                    map: map,
                    strokeWeight: 1,
                    path: boundsEle,
                    fillOpacity: 0.5,
                    fillColor: '#000000',
                    strokeColor: '#ff0000',
                    strokeStyle: 'dashed'
                });
                polygons.push(polygon);
            }
        }
        map.setCity(city,function(){
            map.setFitView();
            map.setZoom(iZoom);
        });
    });
    var toolBar = new AMap.ToolBar();
    map.addControl(toolBar);
})

//覆盖物Marker
var mIndex = 0;
function createMarker(item,parent){
    var markerContent = '<div class="myIcon" data-id='+item.id+'><i style="background-image: url('+item.icon+'); box-shadow: 0px 0px 5px 5px '+parent.color+'"></i><div class="myText">'+'<p>'+parent.name+'</p>'+'<p>'+item.name+'</p>'+'</div></div>';
    var marker = new AMap.Marker({
        position: new AMap.LngLat(item.lat,item.lng),
        content: markerContent,
        title: item.name,
        offset: new AMap.Pixel(-10,-10),
        zIndex: mIndex,
        extData: item.id
    });
    //覆盖物Marker click 事件
    AMap.event.addListener(marker,'click',function(){
        infoBoxContent(item);
        infoBoxShow();
    })
    //覆盖物Marker mouseover 事件
    AMap.event.addListener(marker,'mouseover',function(){
        console.log('移入');
        marker.setzIndex(1);
    })
    //覆盖物Marker mouseout 事件
    AMap.event.addListener(marker,'mouseout',function(){
        marker.setzIndex(0);
    })
    map.add(marker);
}
//地图缩放
var mZoomOld = null;
var mZoomNew = null;
AMap.event.addListener(map,'zoomstart',function(){
    mZoomOld = map.getZoom();
});
AMap.event.addListener(map,'zoomend',function(){
    var iconSize = $('.myIcon>i').width();
    var iconStep = 3;
    var iconPlus = iconSize + iconStep;
    var iconMinus = iconSize - iconStep;
    mZoomNew = map.getZoom();
    console.log(mZoomNew);
    if(mZoomNew > mZoomOld){
        console.log('放大！');
        $('.myIcon>i').animate({ width: iconPlus + 'px', height: iconPlus + 'px', backgroudSize: iconPlus + 'px ' + iconPlus + 'px' });
    }else if(mZoomNew < mZoomOld){
        console.log('缩小！')
        $('.myIcon>i').animate({ width: iconMinus + 'px', height: iconMinus + 'px', backgroudSize: iconMinus + 'px ' + iconMinus + 'px' });
    }
})

//添加导航
function addMenu(item){
    for (let i = 0; i < item.length; i++) {
        var schoolUl = '';
        const group = item[i];
        const schools = item[i].school;
        for (let j = 0; j < schools.length; j++) {
            const school = schools[j];
            var schoolLi = '<li data-id='+school.id+'><a href="javascript:;" style="background-image: url('+school.icon+');">'+school.name+'</a></li>';
            schoolUl += schoolLi;
        }
        var groupLi = '<li><a href="javascript:;" style="background-image: url('+group.icon+');">'+group.name+'</a><ul class="sub">'+schoolUl+'</ul></li>';
        $('.menu').append(groupLi);
    }
}
//顶部 点击事件
$('.container>.header').on('click','h1',function(){
    infoBoxHide();
    var titleActive = $('.container>.header').hasClass('active');
    $('.sub').slideUp('fast',function(){
        $('.menu>li').removeClass('active');
    });
    $('.container>.header')[titleActive ? 'removeClass' : 'addClass']('active');
})
$('.header').on('click','.menu>li>a',function(){
    var menuActive = $(this).parent().hasClass('active');
    $('.sub').slideUp('fast',function(){
        $('.menu>li').removeClass('active');
    });
    if(menuActive){
        $(this).next('.sub').slideUp('fast',function(){
            $(this).parent().removeClass('active');
        });
    }else{
        $(this).next('.sub').slideDown('fast',function(){
            $(this).parent().addClass('active');
        });
    }
})
$('.header').on('click','.sub>li>a',function(){
    var aThis = $(this).parent().attr('data-id');
    var item = null;
    $.each(iData,function(aindex,aitem){
        $.each(aitem.school,function(bindex,bitem){
            if(bitem.id == aThis){
                item = bitem;
            }
        })
    })
    infoBoxContent(item);
    menuHide();
    infoBoxShow();
    map.setZoomAndCenter(19,new AMap.LngLat(item.lat,item.lng));
})

//infoBox内容组装
function infoBoxContent(item){
    //header
    var infoHeaderTitleSpan = '<span>'+item.name+'</span>';
    var infoHeaderTitleUrl = '';
    if(item.url != ''){
        infoHeaderTitleUrl = '<a target="_blank" href="'+item.url+'">视频链接</a>';
    }
    var infoHeaderTitleContent = infoHeaderTitleSpan + infoHeaderTitleUrl;
    var infoHeader = '<div class="header"><div class="title">'+infoHeaderTitleContent+'</div><button class="close">×</button></div>';
    //body
    var infoBodyContentImg = '';
    if(item.image != ''){
        infoBodyContentImg = '<div class="contentImg"><img src="'+item.image+'" alt="'+item.name+'区域图" ></div>';
    }
    var infoBodyContentText = '';
    var infoBodyContentRow = '';
    if(item.rise != '' || item.localRange != '' || item.fieldRange != '' ||  item.phone != ''){
        if(item.rise != ''){
            var itemRise = '<div class="contentRow"><div class="contentRowKey">直升小学</div><div class="contentRowVal">'+item.rise+'</div></div>';
            infoBodyContentRow += itemRise;
        }
        if(item.localRange != ''){
            var itemLocalRange = '<div class="contentRow"><div class="contentRowKey">户籍儿童<br>教育服务区</div><div class="contentRowVal">'+item.localRange+'</div></div>';
            infoBodyContentRow += itemLocalRange;
        }
        if(item.fieldRange != ''){
            var itemFieldRange = '<div class="contentRow"><div class="contentRowKey">随迁子女<br>教育服务区</div><div class="contentRowVal">'+item.fieldRange+'</div></div>';
            infoBodyContentRow += itemFieldRange;
        }
        if(item.phone != ''){
            var itemPhone = '<div class="contentRow"><div class="contentRowKey">电话</div><div class="contentRowVal">'+item.phone+'</div></div>';
            infoBodyContentRow += itemPhone;
        }
        infoBodyContentText = '<div class="contentText">'+infoBodyContentRow+'</div>';
    }
    var infoBodyContentTip = '<div class="contentTip">报名请携带报名材料：房产证及复印件、户口簿及复印件、预防接种卡！</div>';
    var infoBody = '<div class="body">'+infoBodyContentImg+infoBodyContentText+infoBodyContentTip+'</div>';
    //infoBox
    var infoBox = infoHeader + infoBody;
    $('.infoBox').html(infoBox);
}
//导航隐藏
function menuHide(){
    $('.sub').slideUp('fast',function(){
        $('.menu>li').removeClass('active');
    });
    $('.container>.header').removeClass('active');
}

$('.infoBox').on('click','.close',function(){
    infoBoxHide();
})
//弹窗隐藏
function infoBoxHide(){
    $('.infoBox').removeClass('active');
}
//弹窗显示
function infoBoxShow(){
    $('.infoBox').addClass('active');
}