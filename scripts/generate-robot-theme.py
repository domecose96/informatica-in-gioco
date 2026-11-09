"""Generate the original loop Circuiti in movimento for the robot game."""
import math, wave, array, random
from pathlib import Path
rate=22050
beat=60/112
length=64*beat
samples=[0.0]*int(length*rate)
rng=random.Random(1742)
chords=[(48,52,55),(45,48,52),(41,45,48),(43,47,50)]
melody=[72,76,79,76,74,76,79,83,81,79,76,74,72,71,67,71,
        72,76,79,84,83,79,76,74,72,69,72,76,74,71,67,71]
def note(midi,start,duration,amplitude,voice):
    hz=440*2**((midi-69)/12)
    begin=int(start*rate)
    for j in range(min(int(duration*rate),len(samples)-begin)):
        t=j/rate
        envelope=min(1,t/.006)*min(1,max(0,(duration-t)/.035))
        phase=2*math.pi*hz*t
        if voice=='lead': sound=(math.sin(phase)+math.sin(3*phase)/3+math.sin(5*phase)/5)/1.53
        else: sound=math.sin(phase)-math.sin(3*phase)/9
        samples[begin+j]+=amplitude*envelope*sound
for b in range(64):
    chord=chords[(b//4)%4]
    note(chord[0]-12,b*beat,beat*.8,.14,'bass')
    for step in range(4):
        note(chord[step%3]+12,(b+step/4)*beat,beat*.20,.065,'arp')
    note(melody[(b*2)%len(melody)],b*beat,beat*.42,.095,'lead')
    note(melody[(b*2+1)%len(melody)],(b+.5)*beat,beat*.40,.085,'lead')
    start=int(b*beat*rate)
    for j in range(min(int(.13*rate),len(samples)-start)):
        t=j/rate
        samples[start+j]+=.10*math.exp(-t*35)*math.sin(2*math.pi*(80*t-120*t*t))
    for off in [0,.5]:
        start=int((b+off)*beat*rate)
        for j in range(min(int(.035*rate),len(samples)-start)):
            samples[start+j]+=.018*(rng.random()*2-1)*math.exp(-j/(rate*.009))
    if b%2:
        start=int(b*beat*rate)
        for j in range(min(int(.10*rate),len(samples)-start)):
            samples[start+j]+=.035*(rng.random()*2-1)*math.exp(-j/(rate*.025))
pcm=array.array('h',(int(max(-1,min(1,v))*32767) for v in samples))
with wave.open(str(Path(__file__).resolve().parents[1] / 'dist/assets/robot-officina-arcade.wav'),'wb') as output:
    output.setnchannels(1);output.setsampwidth(2);output.setframerate(rate);output.writeframes(pcm.tobytes())
print('Original arcade loop:',round(length,2),'seconds')
