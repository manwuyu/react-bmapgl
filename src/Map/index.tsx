/**
 * @file 地图核心组件
 * @author hedongran
 * @email hdr01@126.com
 */

import React, { ReactNode, ReactElement, CSSProperties } from 'react';
import { Component } from '../common';
import { default as Wrapper, Events, Options, Methods } from '../common/WrapperHOC';
import shallowequal from 'shallowequal';

export interface MapProps {
    /** 中心点坐标 */
    center: BMapGL.Point & string;
    /** 缩放级别 */
    zoom: BMapGL.ZoomType;
    /** 个性化地图样式 */
    mapStyleV2?: BMapGL.MapStyleV2;
    /** 地图最小缩放级别 */
    minZoom?: BMapGL.ZoomType;
    /** 地图最大缩放级别 */
    maxZoom?: BMapGL.ZoomType;
    /** 地图类型，普通地图或地球模式 */
    mapType?: 'normal' | 'earth';
    /** 地图旋转角度 */
    heading?: number;
    /** 地图倾斜角度 */
    tilt?: number;
    /** 是否开启鼠标滚轮缩放 */
    enableScrollWheelZoom?: boolean;
    /** 是否开启双击鼠标缩放 */
    enableDoubleClickZoom?: boolean;
    /** 是否开启地图可拖拽缩放 */
    enableDragging?: boolean;
    /** 鼠标左键单击事件的回调函数 */
    onClick?(e: Event): void;
    /** 地图容器的class类名 */
    className?: string;
    /** 地图容器父元素的style样式 */
    style?: CSSProperties;
};

const eventsMap: Events = [
    'click',
    'dblclick',
    'rightclick',
    'rightdblclick',
    'maptypechange',
    'mousemove',
    'mouseover',
    'mouseout',
    'movestart',
    'moving',
    'moveend',
    'zoomstart',
    'zoomend',
    'addoverlay',
    'addcontrol',
    'removecontrol',
    'removeoverlay',
    'clearoverlays',
    'dragstart',
    'dragging',
    'dragend',
    'addtilelayer',
    'removetilelayer',
    'load',
    'resize',
    'hotspotclick',
    'hotspotover',
    'hotspotout',
    'tilesloaded',
    'touchstart',
    'touchmove',
    'touchend',
    'longpress'
];

const methodsMap: Methods = {
    enableScrollWheelZoom: ['enableScrollWheelZoom', 'disableScrollWheelZoom'],
    enableDragging: ['enableDragging', 'disableDragging'],
    enableDoubleClickZoom: ['enableDoubleClickZoom', 'disableDoubleClickZoom'],
    enableKeyboard: ['enableKeyboard', 'disableKeyboard'],
    enableInertialDragging: ['enableInertialDragging', 'disableInertialDragging'],
    enableContinuousZoom: ['enableContinuousZoom', 'disableContinuousZoom'],
    enablePinchToZoom: ['enablePinchToZoom', 'disablePinchToZoom'],
    enableAutoResize: ['enableAutoResize', 'disableAutoResize']
};

class Map extends Component<MapProps, {}> {

    private el = React.createRef<HTMLDivElement>();
    static defaultProps: MapProps | object;
    map: BMapGL.Map;
    options: Options = [
        'minZoom',
        'maxZoom',
        'mapType'
    ];

    constructor(props: MapProps) {
        super(props);
    }

    componentDidMount() {
        this.initialize();
        this.forceUpdate();
    }

    componentDidUpdate(prevProps: MapProps) {
        let {center: preCenter, zoom: preZoom} = prevProps;
        let {center, zoom} = this.props;

        let isCenterChanged: boolean = center && !shallowequal(preCenter, center);
        let isZoomChanged: boolean = !!(zoom && !shallowequal(preZoom, zoom));
        let centerPoint = new BMapGL.Point(center.lng, center.lat);

        if (isCenterChanged && isZoomChanged) {
            this.map.centerAndZoom(centerPoint, zoom);
        } else if (isCenterChanged) {
            this.map.setCenter(centerPoint);
        } else if (isZoomChanged) {
            this.map.setZoom(zoom);
        }
    }

    componentWillUnmount() {
        /**
         * 销毁地图，当使用 WebGL 渲染地图时，如果确认不再使用该地图实例，则需要
         * 调用本方法销毁 WebGL 上下文，否则频繁创建新地图实例会导致浏览器报：
         * too many WebGL context 的警告。
         */
        if (this.map) {
            this.map.destroy();
        }
    }

    initialize(): void {
        if (this.map) {
            return;
        }

        // 创建Map实例
        let options = this.getOptions();
        if (options.mapType) {
            options.mapType = (options.mapType === 'normal' ? BMAP_NORMAL_MAP : options.mapType);
            options.mapType = (options.mapType === 'earth' ? BMAP_EARTH_MAP : options.mapType);
        }
        if (this.props.mapStyleV2) {
            options.style = this.props.mapStyleV2;
        }
        let map = new BMapGL.Map(this.el.current!, options as BMapGL.MapOptions);

        this.map = map;
        this.instance = map;

        // 正常传入经纬度坐标
        let center = new BMapGL.Point(this.props.center.lng, this.props.center.lat);
        map.centerAndZoom(center, this.props.zoom);  // 初始化地图,设置中心点坐标和地图级别

        if (this.props.heading) {
            map.setHeading(this.props.heading);
        }
        if (this.props.tilt) {
            map.setTilt(this.props.tilt);
        }
    }

    renderChildren(children: ReactElement | ReactElement[], map: BMapGL.Map): ReactNode {
        if (!children || !map) return;

        return React.Children.map(children, (child: ReactElement) => {
            if (!child) {
                return null;
            }
            if (typeof child.type === 'string' || !child.props) {
                return child;
            }
            return React.cloneElement(child, {map}, this.renderChildren(child.props.children, map));
        });
    }

    render() {
        return (
            <div style={this.props.style}>
                <div ref={this.el} className={this.props.className} style={{height: '100%'}}>
                    加载地图中...
                </div>
                {this.renderChildren(this.props.children as ReactElement, this.map)}
            </div>
        );
    }
}

/**
 * defaultProps属性要放在外面，不然生成API文档时，没有默认值
 */
Map.defaultProps = {
    center: {lng: 116.404449, lat: 39.914889},
    zoom: 12,
    style: {
        position: 'relative',
        height: '350px'
    }
};

/**
 * 地图核心对象，地图控件、覆盖物、图层等需作为其子组件，以获得map的实例化对象
 * @visibleName Map 地图
 */
export default Wrapper(Map, eventsMap, methodsMap);

// 顺便给MapApiLoaderHOC在index中加个入口
export {default as MapApiLoaderHOC} from './MapApiLoaderHOC';
