import React, { forwardRef, PropsWithChildren, useImperativeHandle, useRef } from 'react';
import { Animated, Easing, View, ViewStyle } from 'react-native';

import { Point, Size } from '@native-ts/common';

export interface RotateRef{
  timing(angle: number, duration?: number): void;
}

export interface RotateProps{
  anchor: Point;
  size: Size;
  defaultAngle?: number;
  onAnimationEnd?: Animated.EndCallback;
}

const arr = new Array(72001).fill(null);
const inputRange: number[] = [];
const outputRange: string[] = [];

arr.forEach((_, index) => {
  const value = (index - 36000) * 0.01;
  inputRange.push(value);
  outputRange.push(`${value.toFixed(2)}deg`);
});

const Rotate = forwardRef<RotateRef, PropsWithChildren<RotateProps>>(
  function Rotate(props, ref) {

    const { anchor, defaultAngle = 0, children, size, onAnimationEnd } = props;

    const animated = useRef(new Animated.Value(defaultAngle));
    const composite = useRef<Animated.CompositeAnimation>()

    useImperativeHandle(ref, () => ({
      timing(angle, duration = 300) {
        const time = Math.floor(angle / 360);
        const remain = angle % 360;

        composite.current && composite.current.stop();

        if (time !== 0) {
          const length = Math.abs(time);
          const animations = new Array(length).fill(
            Animated.timing(animated.current, {
              toValue: 360 * time / length,
              duration: angle !== 0 ? duration * 360 / Math.abs(angle) : duration,
              easing: Easing.linear,
              useNativeDriver: true
            })
          )

          remain !== 0 && animations.push(
            Animated.timing(animated.current, {
              toValue: remain,
              duration:  angle !== 0 ? duration * Math.abs(remain) / Math.abs(angle) : duration,
              easing: Easing.linear,
              useNativeDriver: true
            })
          );

          composite.current = Animated.sequence(animations);
        }
        else {
          composite.current = Animated.timing(animated.current, {
            toValue: angle,
            duration,
            easing: Easing.linear,
            useNativeDriver: true
          })
        }

        composite.current.start(onAnimationEnd);
      },
    }));

    const rotateStyle: ViewStyle = {};
    const innerStyle: ViewStyle = {};
    const finalAnchor = new Point(anchor.x, anchor.y);

    if (size && size.width && size.height) {
      const { x, y } = anchor;
      const { width, height } = size;

      if (x < 0 || x > width || y < 0 || y > height) {
        finalAnchor.x = size.width / 2;
        finalAnchor.y = size.height / 2;
      }

      const horizontal = Math.max(finalAnchor.x, width - finalAnchor.x);
      const vertical = Math.max(finalAnchor.y, height - finalAnchor.y);
      const marginTop = Math.abs(vertical - finalAnchor.x);
      const marginLeft = Math.abs(horizontal - finalAnchor.y)

      rotateStyle.width = horizontal * 2;
      rotateStyle.height = vertical * 2;
      rotateStyle.marginTop = -marginTop;
      rotateStyle.marginLeft = -marginLeft;

      innerStyle.marginTop = marginTop;
      innerStyle.marginLeft = marginLeft;
    }

    const rotate = animated.current.interpolate({ inputRange, outputRange });

    return (
      <View style={size}>
        <Animated.View style={[ rotateStyle, { transform: [{ rotate }] } ]}>
          <View
            style={[size, innerStyle]}
          >
            { children }
          </View>
        </Animated.View>
      </View>
    );
  }
);

export default Rotate;
