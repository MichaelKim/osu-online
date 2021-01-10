first obj = 0.000

tick fade (tf): 0.375 (constant)

dt: difference between first end time and second start time
ff: first fade (when first tick starts fading in)
~= -0.78 + 0.15dt
lf: last fade (when last tick starts fading in)
ddt: lf - ff
ft: first time (when first tick is fully visible)
lt: last time (when last tick is fully visible)

follow points start fading in at -0.78+0.15dt

         dx

1 ------------------ 2
t: 0 t: dt
ff:~-0.78 + 0.15dt lf: ff + ddt ~= ff + 0.7dt
ft: ff + tf lt: lf + tf

dt: 0.3
ff: -0.75 - -0.675

dt: 0.075
ff: -0.825 - -0.75

dt: 0.825
ff: -0.675 - -0.6

dt: 1.65
ff: -0.6 - -0.525

dt: 1.35
ff: -0.6 - -0.525

dt: 0
ff: -1.350 - -1.275
-0.825 - -0.75

dt: 2.625
ff: -0.45 - -0.375

dt: 3.45
ff: -0.3 - -0.225

dt: 3.975
ff: -0.225 - -0.15

dt: 5.475
ff: 0 - 0.075

- distance (dx) doesn't affect timing
- hit object types doesn't affect timing (first's end - second's start)
- time delta (dt) affects trail speed
- each tick takes 0.375 to fade in, independent of dt and dx
- od and ar doesn't affect when appear
- ddt ~~ 0.7dt or dt ~~ 1.4ddt
- first tick starts appearing

starts appearing 1:850 - 1:925
full at 2:450
first object at 2:600
second at 2:900

dt = 0.3
first tick fade in 1:850 - 1:925
first tick full at 2:225 - 2:300 dt = 0.375
last tick fade in 2:000 - 2:075
last tick full at 2:375 - 2:450 dt = 0.375

dt between first and last = 0.15

diff first tick fade in - first object = 0.675 - 0.75
diff first tick fade in - second obj = 0.975 - 1.05

2:600
2:675 dt = 0.075
1:775 - 1:850
2:150 - 2:225 dt = 0.375
1:850 - 1:925
2:225 - 2:300 dt = 0.375
ddt = 0.075

0.75 - 0.825
0.825 - 0.9

2.600
3.425 dt = 0.825
1:925 - 2:000
2.300 - 2.375 dt = 0.375
2.450 - 2.525
2.825 - 2.900 dt = 0.375
ddt = 0.525

0.6 - 0.675
1.425 - 1.5

1.775
3.425 dt = 1.65
1.175 - 1.250
1.550 - 1.625 dt = 0.375
2.375 - 2450
2.750 - 2.825 dt = 0.375
ddt = 1.2

0.525 - 0.6
2.175 - 2.25

2.075
3.425 dt = 1.35
1.475 - 1.550
1.850 - 1.925
2.375 - 2.450
2.750 - 2.825
ddt = 0.9

0.525 - 0.6
1.875 - 1.95

2.100
dt = 0
1.275 - 1.350

1:775 - 1:850
2:225
2:600
2:675

1:925 - 2:000

2:600
3:425
