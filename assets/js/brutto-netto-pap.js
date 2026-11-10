/* BMF PAP 2026, source: https://www.bmf-steuerrechner.de/interface/pseudocodes.xhtml.
Decimal arithmetic preserves the PAP rounding rules. Annual factory constants come from XLSX. */
(function(root){
const D=root.Decimal;D.set({precision:40});
const BigDecimal={ZERO:new D(0),ONE:new D(1),TEN:new D(10),valueOf:v=>new D(v),ROUND_DOWN:1,ROUND_UP:0};
D.prototype.add=D.prototype.plus;D.prototype.subtract=D.prototype.minus;D.prototype.multiply=D.prototype.times;
D.prototype.divide=function(v,scale,mode){const n=this.div(v);return scale===undefined?n:n.toDecimalPlaces(scale,mode)};
D.prototype.setScale=function(s,m=1){return this.toDecimalPlaces(s,m)};
D.prototype.compareTo=D.prototype.cmp;D.prototype.longValue=function(){return this.trunc().toNumber()};
root.FinanzPAP=function(input,p){
let af=1;
let AJAHR=0;
let ALTER1=0;
let ALV=0;
let f=1.0;
let JFREIB=BigDecimal.ZERO;
let JHINZU=BigDecimal.ZERO;
let JRE4=BigDecimal.ZERO;
let JRE4ENT=BigDecimal.ZERO;
let JVBEZ=BigDecimal.ZERO;
let KRV=0;
let KVZ=BigDecimal.ZERO;
let LZZ=1;
let LZZFREIB=BigDecimal.ZERO;
let LZZHINZU=BigDecimal.ZERO;
let MBV=BigDecimal.ZERO;
let PKPV=BigDecimal.ZERO;
let PKPVAGZ=BigDecimal.ZERO;
let PKV=0;
let PVA=BigDecimal.ZERO;
let PVS=0;
let PVZ=0;
let R=0;
let RE4=BigDecimal.ZERO;
let SONSTB=BigDecimal.ZERO;
let SONSTENT=BigDecimal.ZERO;
let STERBE=BigDecimal.ZERO;
let STKL=1;
let VBEZ=BigDecimal.ZERO;
let VBEZM=BigDecimal.ZERO;
let VBEZS=BigDecimal.ZERO;
let VBS=BigDecimal.ZERO;
let VJAHR=0;
let ZKF=BigDecimal.ZERO;
let ZMVB=0;
let BK=BigDecimal.ZERO;
let BKS=BigDecimal.ZERO;
let LSTLZZ=BigDecimal.ZERO;
let SOLZLZZ=BigDecimal.ZERO;
let SOLZS=BigDecimal.ZERO;
let STS=BigDecimal.ZERO;
let VFRB=BigDecimal.ZERO;
let VFRBS1=BigDecimal.ZERO;
let VFRBS2=BigDecimal.ZERO;
let WVFRB=BigDecimal.ZERO;
let WVFRBO=BigDecimal.ZERO;
let WVFRBM=BigDecimal.ZERO;
let ALTE=BigDecimal.ZERO;
let ANP=BigDecimal.ZERO;
let ANTEIL1=BigDecimal.ZERO;
let AVSATZAN=BigDecimal.ZERO;
let BBGKVPV=BigDecimal.ZERO;
let BBGRVALV=BigDecimal.ZERO;
let BMG=BigDecimal.ZERO;
let DIFF=BigDecimal.ZERO;
let EFA=BigDecimal.ZERO;
let FVB=BigDecimal.ZERO;
let FVBSO=BigDecimal.ZERO;
let FVBZ=BigDecimal.ZERO;
let FVBZSO=BigDecimal.ZERO;
let GFB=BigDecimal.ZERO;
let HBALTE=BigDecimal.ZERO;
let HFVB=BigDecimal.ZERO;
let HFVBZ=BigDecimal.ZERO;
let HFVBZSO=BigDecimal.ZERO;
let HOCH=BigDecimal.ZERO;
let J=0;
let JBMG=BigDecimal.ZERO;
let JLFREIB=BigDecimal.ZERO;
let JLHINZU=BigDecimal.ZERO;
let JW=BigDecimal.ZERO;
let K=0;
let KFB=BigDecimal.ZERO;
let KVSATZAN=BigDecimal.ZERO;
let KZTAB=0;
let LSTJAHR=BigDecimal.ZERO;
let LSTOSO=BigDecimal.ZERO;
let LSTSO=BigDecimal.ZERO;
let MIST=BigDecimal.ZERO;
let PKPVAGZJ=BigDecimal.ZERO;
let PVSATZAN=BigDecimal.ZERO;
let RVSATZAN=BigDecimal.ZERO;
let RW=BigDecimal.ZERO;
let SAP=BigDecimal.ZERO;
let SOLZFREI=BigDecimal.ZERO;
let SOLZJ=BigDecimal.ZERO;
let SOLZMIN=BigDecimal.ZERO;
let SOLZSBMG=BigDecimal.ZERO;
let SOLZSZVE=BigDecimal.ZERO;
let ST=BigDecimal.ZERO;
let ST1=BigDecimal.ZERO;
let ST2=BigDecimal.ZERO;
let VBEZB=BigDecimal.ZERO;
let VBEZBSO=BigDecimal.ZERO;
let VERGL=BigDecimal.ZERO;
let VSPHB=BigDecimal.ZERO;
let VSP=BigDecimal.ZERO;
let VSPN=BigDecimal.ZERO;
let VSPALV=BigDecimal.ZERO;
let VSPKVPV=BigDecimal.ZERO;
let VSPR=BigDecimal.ZERO;
let W1STKL5=BigDecimal.ZERO;
let W2STKL5=BigDecimal.ZERO;
let W3STKL5=BigDecimal.ZERO;
let X=BigDecimal.ZERO;
let Y=BigDecimal.ZERO;
let ZRE4=BigDecimal.ZERO;
let ZRE4J=BigDecimal.ZERO;
let ZRE4VP=BigDecimal.ZERO;
let ZRE4VPR=BigDecimal.ZERO;
let ZTABFB=BigDecimal.ZERO;
let ZVBEZ=BigDecimal.ZERO;
let ZVBEZJ=BigDecimal.ZERO;
let ZVE=BigDecimal.ZERO;
let ZX=BigDecimal.ZERO;
let ZZX=BigDecimal.ZERO;
let TAB1=[BigDecimal.ZERO, BigDecimal.valueOf(p["TAB1"]), BigDecimal.valueOf(p["TAB1_1"]), BigDecimal.valueOf(p["TAB1_2"]), BigDecimal.valueOf(p["TAB1_3"]), BigDecimal.valueOf(p["TAB1_4"]), BigDecimal.valueOf(p["TAB1_5"]), BigDecimal.valueOf(p["TAB1_6"]), BigDecimal.valueOf(p["TAB1_7"]), BigDecimal.valueOf(p["TAB1_8"]), BigDecimal.valueOf(p["TAB1_9"]), BigDecimal.valueOf(p["TAB1_10"]), BigDecimal.valueOf(p["TAB1_11"]), BigDecimal.valueOf(p["TAB1_12"]), BigDecimal.valueOf(p["TAB1_13"]), BigDecimal.valueOf(p["TAB1_14"]), BigDecimal.valueOf(p["TAB1_15"]), BigDecimal.valueOf(p["TAB1_16"]), BigDecimal.valueOf(p["TAB1_17"]), BigDecimal.valueOf(p["TAB1_18"]), BigDecimal.valueOf(p["TAB1_19"]), BigDecimal.valueOf(p["TAB1_20"]), BigDecimal.valueOf(p["TAB1_21"]), BigDecimal.valueOf(p["TAB1_22"]), BigDecimal.valueOf(p["TAB1_23"]), BigDecimal.valueOf(p["TAB1_24"]), BigDecimal.valueOf(p["TAB1_25"]), BigDecimal.valueOf(p["TAB1_26"]), BigDecimal.valueOf(p["TAB1_27"]), BigDecimal.valueOf(p["TAB1_28"]), BigDecimal.valueOf(p["TAB1_29"]), BigDecimal.valueOf(p["TAB1_30"]), BigDecimal.valueOf(p["TAB1_31"]), BigDecimal.valueOf(p["TAB1_32"]), BigDecimal.valueOf(p["TAB1_33"]), BigDecimal.valueOf(p["TAB1_34"]), BigDecimal.valueOf(p["TAB1_35"]), BigDecimal.valueOf(p["TAB1_36"]), BigDecimal.valueOf(p["TAB1_37"]), BigDecimal.valueOf(p["TAB1_38"]), BigDecimal.valueOf(p["TAB1_39"]), BigDecimal.valueOf(p["TAB1_40"]), BigDecimal.valueOf(p["TAB1_41"]), BigDecimal.valueOf(p["TAB1_42"]), BigDecimal.valueOf(p["TAB1_43"]), BigDecimal.valueOf(p["TAB1_44"]), BigDecimal.valueOf(p["TAB1_45"]), BigDecimal.valueOf(p["TAB1_46"]), BigDecimal.valueOf(p["TAB1_47"]), BigDecimal.valueOf(p["TAB1_48"]), BigDecimal.valueOf(p["TAB1_49"]), BigDecimal.valueOf(p["TAB1_50"]), BigDecimal.valueOf(p["TAB1_51"]), BigDecimal.valueOf(p["TAB1_52"]), BigDecimal.valueOf(p["TAB1_53"])];
let TAB2=[BigDecimal.ZERO, BigDecimal.valueOf(p["TAB2"]), BigDecimal.valueOf(p["TAB2_55"]), BigDecimal.valueOf(p["TAB2_56"]), BigDecimal.valueOf(p["TAB2_57"]), BigDecimal.valueOf(p["TAB2_58"]), BigDecimal.valueOf(p["TAB2_59"]), BigDecimal.valueOf(p["TAB2_60"]), BigDecimal.valueOf(p["TAB2_61"]), BigDecimal.valueOf(p["TAB2_62"]), BigDecimal.valueOf(p["TAB2_63"]), BigDecimal.valueOf(p["TAB2_64"]), BigDecimal.valueOf(p["TAB2_65"]), BigDecimal.valueOf(p["TAB2_66"]), BigDecimal.valueOf(p["TAB2_67"]), BigDecimal.valueOf(p["TAB2_68"]), BigDecimal.valueOf(p["TAB2_69"]), BigDecimal.valueOf(p["TAB2_70"]), BigDecimal.valueOf(p["TAB2_71"]), BigDecimal.valueOf(p["TAB2_72"]), BigDecimal.valueOf(p["TAB2_73"]), BigDecimal.valueOf(p["TAB2_74"]), BigDecimal.valueOf(p["TAB2_75"]), BigDecimal.valueOf(p["TAB2_76"]), BigDecimal.valueOf(p["TAB2_77"]), BigDecimal.valueOf(p["TAB2_78"]), BigDecimal.valueOf(p["TAB2_79"]), BigDecimal.valueOf(p["TAB2_80"]), BigDecimal.valueOf(p["TAB2_81"]), BigDecimal.valueOf(p["TAB2_82"]), BigDecimal.valueOf(p["TAB2_83"]), BigDecimal.valueOf(p["TAB2_84"]), BigDecimal.valueOf(p["TAB2_85"]), BigDecimal.valueOf(p["TAB2_86"]), BigDecimal.valueOf(p["TAB2_87"]), BigDecimal.valueOf(p["TAB2_88"]), BigDecimal.valueOf(p["TAB2_89"]), BigDecimal.valueOf(p["TAB2_90"]), BigDecimal.valueOf(p["TAB2_91"]), BigDecimal.valueOf(p["TAB2_92"]), BigDecimal.valueOf(p["TAB2_93"]), BigDecimal.valueOf(p["TAB2_94"]), BigDecimal.valueOf(p["TAB2_95"]), BigDecimal.valueOf(p["TAB2_96"]), BigDecimal.valueOf(p["TAB2_97"]), BigDecimal.valueOf(p["TAB2_98"]), BigDecimal.valueOf(p["TAB2_99"]), BigDecimal.valueOf(p["TAB2_100"]), BigDecimal.valueOf(p["TAB2_101"]), BigDecimal.valueOf(p["TAB2_102"]), BigDecimal.valueOf(p["TAB2_103"]), BigDecimal.valueOf(p["TAB2_104"]), BigDecimal.valueOf(p["TAB2_105"]), BigDecimal.valueOf(p["TAB2_106"]), BigDecimal.valueOf(p["TAB2_107"]) ];
let TAB3=[BigDecimal.ZERO, BigDecimal.valueOf(p["TAB3"]), BigDecimal.valueOf(p["TAB3_109"]), BigDecimal.valueOf(p["TAB3_110"]), BigDecimal.valueOf(p["TAB3_111"]), BigDecimal.valueOf(p["TAB3_112"]), BigDecimal.valueOf(p["TAB3_113"]), BigDecimal.valueOf(p["TAB3_114"]), BigDecimal.valueOf(p["TAB3_115"]), BigDecimal.valueOf(p["TAB3_116"]), BigDecimal.valueOf(p["TAB3_117"]), BigDecimal.valueOf(p["TAB3_118"]), BigDecimal.valueOf(p["TAB3_119"]), BigDecimal.valueOf(p["TAB3_120"]), BigDecimal.valueOf(p["TAB3_121"]), BigDecimal.valueOf(p["TAB3_122"]), BigDecimal.valueOf(p["TAB3_123"]), BigDecimal.valueOf(p["TAB3_124"]), BigDecimal.valueOf(p["TAB3_125"]), BigDecimal.valueOf(p["TAB3_126"]), BigDecimal.valueOf(p["TAB3_127"]), BigDecimal.valueOf(p["TAB3_128"]), BigDecimal.valueOf(p["TAB3_129"]), BigDecimal.valueOf(p["TAB3_130"]), BigDecimal.valueOf(p["TAB3_131"]), BigDecimal.valueOf(p["TAB3_132"]), BigDecimal.valueOf(p["TAB3_133"]), BigDecimal.valueOf(p["TAB3_134"]), BigDecimal.valueOf(p["TAB3_135"]), BigDecimal.valueOf(p["TAB3_136"]), BigDecimal.valueOf(p["TAB3_137"]), BigDecimal.valueOf(p["TAB3_138"]), BigDecimal.valueOf(p["TAB3_139"]), BigDecimal.valueOf(p["TAB3_140"]), BigDecimal.valueOf(p["TAB3_141"]), BigDecimal.valueOf(p["TAB3_142"]), BigDecimal.valueOf(p["TAB3_143"]), BigDecimal.valueOf(p["TAB3_144"]), BigDecimal.valueOf(p["TAB3_145"]), BigDecimal.valueOf(p["TAB3_146"]), BigDecimal.valueOf(p["TAB3_147"]), BigDecimal.valueOf(p["TAB3_148"]), BigDecimal.valueOf(p["TAB3_149"]), BigDecimal.valueOf(p["TAB3_150"]), BigDecimal.valueOf(p["TAB3_151"]), BigDecimal.valueOf(p["TAB3_152"]), BigDecimal.valueOf(p["TAB3_153"]), BigDecimal.valueOf(p["TAB3_154"]), BigDecimal.valueOf(p["TAB3_155"]), BigDecimal.valueOf(p["TAB3_156"]), BigDecimal.valueOf(p["TAB3_157"]), BigDecimal.valueOf(p["TAB3_158"]), BigDecimal.valueOf(p["TAB3_159"]), BigDecimal.valueOf(p["TAB3_160"]), BigDecimal.valueOf(p["TAB3_161"])];
let TAB4=[BigDecimal.ZERO, BigDecimal.valueOf(p["TAB4"]), BigDecimal.valueOf(p["TAB4_163"]), BigDecimal.valueOf(p["TAB4_164"]), BigDecimal.valueOf(p["TAB4_165"]), BigDecimal.valueOf(p["TAB4_166"]), BigDecimal.valueOf(p["TAB4_167"]), BigDecimal.valueOf(p["TAB4_168"]), BigDecimal.valueOf(p["TAB4_169"]), BigDecimal.valueOf(p["TAB4_170"]), BigDecimal.valueOf(p["TAB4_171"]), BigDecimal.valueOf(p["TAB4_172"]), BigDecimal.valueOf(p["TAB4_173"]), BigDecimal.valueOf(p["TAB4_174"]), BigDecimal.valueOf(p["TAB4_175"]), BigDecimal.valueOf(p["TAB4_176"]), BigDecimal.valueOf(p["TAB4_177"]), BigDecimal.valueOf(p["TAB4_178"]), BigDecimal.valueOf(p["TAB4_179"]), BigDecimal.valueOf(p["TAB4_180"]), BigDecimal.valueOf(p["TAB4_181"]), BigDecimal.valueOf(p["TAB4_182"]), BigDecimal.valueOf(p["TAB4_183"]), BigDecimal.valueOf(p["TAB4_184"]), BigDecimal.valueOf(p["TAB4_185"]), BigDecimal.valueOf(p["TAB4_186"]), BigDecimal.valueOf(p["TAB4_187"]), BigDecimal.valueOf(p["TAB4_188"]), BigDecimal.valueOf(p["TAB4_189"]), BigDecimal.valueOf(p["TAB4_190"]), BigDecimal.valueOf(p["TAB4_191"]), BigDecimal.valueOf(p["TAB4_192"]), BigDecimal.valueOf(p["TAB4_193"]), BigDecimal.valueOf(p["TAB4_194"]), BigDecimal.valueOf(p["TAB4_195"]), BigDecimal.valueOf(p["TAB4_196"]), BigDecimal.valueOf(p["TAB4_197"]), BigDecimal.valueOf(p["TAB4_198"]), BigDecimal.valueOf(p["TAB4_199"]), BigDecimal.valueOf(p["TAB4_200"]), BigDecimal.valueOf(p["TAB4_201"]), BigDecimal.valueOf(p["TAB4_202"]), BigDecimal.valueOf(p["TAB4_203"]), BigDecimal.valueOf(p["TAB4_204"]), BigDecimal.valueOf(p["TAB4_205"]), BigDecimal.valueOf(p["TAB4_206"]), BigDecimal.valueOf(p["TAB4_207"]), BigDecimal.valueOf(p["TAB4_208"]), BigDecimal.valueOf(p["TAB4_209"]), BigDecimal.valueOf(p["TAB4_210"]), BigDecimal.valueOf(p["TAB4_211"]), BigDecimal.valueOf(p["TAB4_212"]), BigDecimal.valueOf(p["TAB4_213"]), BigDecimal.valueOf(p["TAB4_214"]), BigDecimal.valueOf(p["TAB4_215"])];
let TAB5=[BigDecimal.ZERO, BigDecimal.valueOf(p["TAB5"]), BigDecimal.valueOf(p["TAB5_217"]), BigDecimal.valueOf(p["TAB5_218"]), BigDecimal.valueOf(p["TAB5_219"]), BigDecimal.valueOf(p["TAB5_220"]), BigDecimal.valueOf(p["TAB5_221"]), BigDecimal.valueOf(p["TAB5_222"]), BigDecimal.valueOf(p["TAB5_223"]), BigDecimal.valueOf(p["TAB5_224"]), BigDecimal.valueOf(p["TAB5_225"]), BigDecimal.valueOf(p["TAB5_226"]), BigDecimal.valueOf(p["TAB5_227"]), BigDecimal.valueOf(p["TAB5_228"]), BigDecimal.valueOf(p["TAB5_229"]), BigDecimal.valueOf(p["TAB5_230"]), BigDecimal.valueOf(p["TAB5_231"]), BigDecimal.valueOf(p["TAB5_232"]), BigDecimal.valueOf(p["TAB5_233"]), BigDecimal.valueOf(p["TAB5_234"]), BigDecimal.valueOf(p["TAB5_235"]), BigDecimal.valueOf(p["TAB5_236"]), BigDecimal.valueOf(p["TAB5_237"]), BigDecimal.valueOf(p["TAB5_238"]), BigDecimal.valueOf(p["TAB5_239"]), BigDecimal.valueOf(p["TAB5_240"]), BigDecimal.valueOf(p["TAB5_241"]), BigDecimal.valueOf(p["TAB5_242"]), BigDecimal.valueOf(p["TAB5_243"]), BigDecimal.valueOf(p["TAB5_244"]), BigDecimal.valueOf(p["TAB5_245"]), BigDecimal.valueOf(p["TAB5_246"]), BigDecimal.valueOf(p["TAB5_247"]), BigDecimal.valueOf(p["TAB5_248"]), BigDecimal.valueOf(p["TAB5_249"]), BigDecimal.valueOf(p["TAB5_250"]), BigDecimal.valueOf(p["TAB5_251"]), BigDecimal.valueOf(p["TAB5_252"]), BigDecimal.valueOf(p["TAB5_253"]), BigDecimal.valueOf(p["TAB5_254"]), BigDecimal.valueOf(p["TAB5_255"]), BigDecimal.valueOf(p["TAB5_256"]), BigDecimal.valueOf(p["TAB5_257"]), BigDecimal.valueOf(p["TAB5_258"]), BigDecimal.valueOf(p["TAB5_259"]), BigDecimal.valueOf(p["TAB5_260"]), BigDecimal.valueOf(p["TAB5_261"]), BigDecimal.valueOf(p["TAB5_262"]), BigDecimal.valueOf(p["TAB5_263"]), BigDecimal.valueOf(p["TAB5_264"]), BigDecimal.valueOf(p["TAB5_265"]), BigDecimal.valueOf(p["TAB5_266"]), BigDecimal.valueOf(p["TAB5_267"]), BigDecimal.valueOf(p["TAB5_268"]), BigDecimal.valueOf(p["TAB5_269"])];
let ZAHL1=BigDecimal.ONE;
let ZAHL2=BigDecimal.valueOf(p["ZAHL2"]);
let ZAHL5=BigDecimal.valueOf(p["ZAHL5"]);
let ZAHL7=BigDecimal.valueOf(p["ZAHL7"]);
let ZAHL12=BigDecimal.valueOf(p["ZAHL12"]);
let ZAHL100=BigDecimal.valueOf(p["ZAHL100"]);
let ZAHL360=BigDecimal.valueOf(p["ZAHL360"]);
let ZAHL500=BigDecimal.valueOf(p["ZAHL500"]);
let ZAHL700=BigDecimal.valueOf(p["ZAHL700"]);
let ZAHL1000=BigDecimal.valueOf(p["ZAHL1000"]);
let ZAHL10000=BigDecimal.valueOf(p["ZAHL10000"]);
af=input.af===undefined?af:input.af;
AJAHR=input.AJAHR===undefined?AJAHR:input.AJAHR;
ALTER1=input.ALTER1===undefined?ALTER1:input.ALTER1;
ALV=input.ALV===undefined?ALV:input.ALV;
f=input.f===undefined?f:input.f;
JFREIB=input.JFREIB===undefined?JFREIB:new D(input.JFREIB);
JHINZU=input.JHINZU===undefined?JHINZU:new D(input.JHINZU);
JRE4=input.JRE4===undefined?JRE4:new D(input.JRE4);
JRE4ENT=input.JRE4ENT===undefined?JRE4ENT:new D(input.JRE4ENT);
JVBEZ=input.JVBEZ===undefined?JVBEZ:new D(input.JVBEZ);
KRV=input.KRV===undefined?KRV:input.KRV;
KVZ=input.KVZ===undefined?KVZ:new D(input.KVZ);
LZZ=input.LZZ===undefined?LZZ:input.LZZ;
LZZFREIB=input.LZZFREIB===undefined?LZZFREIB:new D(input.LZZFREIB);
LZZHINZU=input.LZZHINZU===undefined?LZZHINZU:new D(input.LZZHINZU);
MBV=input.MBV===undefined?MBV:new D(input.MBV);
PKPV=input.PKPV===undefined?PKPV:new D(input.PKPV);
PKPVAGZ=input.PKPVAGZ===undefined?PKPVAGZ:new D(input.PKPVAGZ);
PKV=input.PKV===undefined?PKV:input.PKV;
PVA=input.PVA===undefined?PVA:new D(input.PVA);
PVS=input.PVS===undefined?PVS:input.PVS;
PVZ=input.PVZ===undefined?PVZ:input.PVZ;
R=input.R===undefined?R:input.R;
RE4=input.RE4===undefined?RE4:new D(input.RE4);
SONSTB=input.SONSTB===undefined?SONSTB:new D(input.SONSTB);
SONSTENT=input.SONSTENT===undefined?SONSTENT:new D(input.SONSTENT);
STERBE=input.STERBE===undefined?STERBE:new D(input.STERBE);
STKL=input.STKL===undefined?STKL:input.STKL;
VBEZ=input.VBEZ===undefined?VBEZ:new D(input.VBEZ);
VBEZM=input.VBEZM===undefined?VBEZM:new D(input.VBEZM);
VBEZS=input.VBEZS===undefined?VBEZS:new D(input.VBEZS);
VBS=input.VBS===undefined?VBS:new D(input.VBS);
VJAHR=input.VJAHR===undefined?VJAHR:input.VJAHR;
ZKF=input.ZKF===undefined?ZKF:new D(input.ZKF);
ZMVB=input.ZMVB===undefined?ZMVB:input.ZMVB;
function MAIN(){MPARA();
MRE4JL();
VBEZBSO= BigDecimal.ZERO;
MRE4();
MRE4ABZ();
MBERECH();
MSONST();}
function MPARA(){BBGRVALV = BigDecimal.valueOf(p["MPARA_BBGRVALV"]);
AVSATZAN = BigDecimal.valueOf(p["MPARA_AVSATZAN"]);
RVSATZAN = BigDecimal.valueOf(p["MPARA_RVSATZAN"]);
BBGKVPV = BigDecimal.valueOf(p["MPARA_BBGKVPV"]);
KVSATZAN = (KVZ.divide(ZAHL2).divide(ZAHL100)).add(BigDecimal.valueOf(p["MPARA_KVSATZAN"]));
if(PVS == 1){PVSATZAN = BigDecimal.valueOf(p["MPARA_PVSATZAN"]);}
else{PVSATZAN =  BigDecimal.valueOf(p["MPARA_PVSATZAN_286"]);}
if(PVZ == 1){PVSATZAN = PVSATZAN.add(BigDecimal.valueOf(p["MPARA_PVSATZAN_287"]));}
else{PVSATZAN = PVSATZAN.subtract(PVA.multiply(BigDecimal.valueOf(p["MPARA_PVSATZAN_288"])));}
W1STKL5 = BigDecimal.valueOf(p["MPARA_W1STKL5"]);
W2STKL5 = BigDecimal.valueOf(p["MPARA_W2STKL5"]);
W3STKL5 = BigDecimal.valueOf(p["MPARA_W3STKL5"]);
GFB = BigDecimal.valueOf(p["MPARA_GFB"]);
SOLZFREI = BigDecimal.valueOf(p["MPARA_SOLZFREI"]);}
function MRE4JL(){if(LZZ == 1){ZRE4J= RE4.divide (ZAHL100, 2, 1);
ZVBEZJ= VBEZ.divide (ZAHL100, 2, 1);
JLFREIB= LZZFREIB.divide (ZAHL100, 2, 1);
JLHINZU= LZZHINZU.divide (ZAHL100, 2, 1);}
else{if(LZZ == 2){ZRE4J= (RE4.multiply (ZAHL12)).divide (ZAHL100, 2, 1);
ZVBEZJ= (VBEZ.multiply (ZAHL12)).divide (ZAHL100, 2, 1);
JLFREIB= (LZZFREIB.multiply (ZAHL12)).divide (ZAHL100, 2, 1);
JLHINZU= (LZZHINZU.multiply (ZAHL12)).divide (ZAHL100, 2, 1);}
else{if(LZZ == 3){ZRE4J= (RE4.multiply (ZAHL360)).divide (ZAHL700, 2, 1);
ZVBEZJ= (VBEZ.multiply (ZAHL360)).divide (ZAHL700, 2, 1);
JLFREIB= (LZZFREIB.multiply (ZAHL360)).divide (ZAHL700, 2, 1);
JLHINZU= (LZZHINZU.multiply (ZAHL360)).divide (ZAHL700, 2, 1);}
else{ZRE4J= (RE4.multiply (ZAHL360)).divide (ZAHL100, 2, 1);
ZVBEZJ= (VBEZ.multiply (ZAHL360)).divide (ZAHL100, 2, 1);
JLFREIB= (LZZFREIB.multiply (ZAHL360)).divide (ZAHL100, 2, 1);
JLHINZU= (LZZHINZU.multiply (ZAHL360)).divide (ZAHL100, 2, 1);}}}
if(af == 0){f= 1;}}
function MRE4(){if(ZVBEZJ.compareTo (BigDecimal.ZERO) == 0){FVBZ= BigDecimal.ZERO;
FVB= BigDecimal.ZERO;
FVBZSO= BigDecimal.ZERO;
FVBSO= BigDecimal.ZERO;}
else{if(VJAHR < 2006){J= 1;}
else{if(VJAHR < 2058){J= VJAHR - 2004;}
else{J= 54;}}
if(LZZ == 1){VBEZB= (VBEZM.multiply (BigDecimal.valueOf(ZMVB))).add (VBEZS);
HFVB= TAB2[J].divide (ZAHL12).multiply (BigDecimal.valueOf(ZMVB)).setScale (0, 0);
FVBZ= TAB3[J].divide (ZAHL12).multiply (BigDecimal.valueOf(ZMVB)).setScale (0, 0);}
else{VBEZB= ((VBEZM.multiply (ZAHL12)).add (VBEZS)).setScale (2, 1);
HFVB= TAB2[J];
FVBZ= TAB3[J];}
FVB= ((VBEZB.multiply (TAB1[J]))).divide (ZAHL100).setScale (2, 0);
if(FVB.compareTo (HFVB) == 1){FVB = HFVB;}
if(FVB.compareTo (ZVBEZJ) == 1){FVB = ZVBEZJ;}
FVBSO= (FVB.add((VBEZBSO.multiply (TAB1[J])).divide (ZAHL100))).setScale (2, 0);
if(FVBSO.compareTo (TAB2[J]) == 1){FVBSO = TAB2[J];}
HFVBZSO= (((VBEZB.add(VBEZBSO)).divide (ZAHL100)).subtract (FVBSO)).setScale (2, 1);
FVBZSO= (FVBZ.add((VBEZBSO).divide (ZAHL100))).setScale (0, 0);
if(FVBZSO.compareTo (HFVBZSO) == 1){FVBZSO = HFVBZSO.setScale(0, 0);}
if(FVBZSO.compareTo (TAB3[J]) == 1){FVBZSO = TAB3[J];}
HFVBZ= ((VBEZB.divide (ZAHL100)).subtract (FVB)).setScale (2, 1);
if(FVBZ.compareTo (HFVBZ) == 1){FVBZ = HFVBZ.setScale (0, 0);}}
MRE4ALTE();}
function MRE4ALTE(){if(ALTER1 == 0){ALTE= BigDecimal.ZERO;}
else{if(AJAHR < 2006){K= 1;}
else{if(AJAHR < 2058){K= AJAHR - 2004;}
else{K= 54;}}
BMG= ZRE4J.subtract (ZVBEZJ);
ALTE = (BMG.multiply(TAB4[K])).setScale(0, 0);
HBALTE= TAB5[K];
if(ALTE.compareTo (HBALTE) == 1){ALTE= HBALTE;}}}
function MRE4ABZ(){ZRE4= (ZRE4J.subtract (FVB).subtract   (ALTE).subtract (JLFREIB).add (JLHINZU)).setScale (2, 1);
if(ZRE4.compareTo (BigDecimal.ZERO) == -1){ZRE4= BigDecimal.ZERO;}
ZRE4VP= ZRE4J;
ZVBEZ = ZVBEZJ.subtract(FVB).setScale(2, 1);
if(ZVBEZ.compareTo(BigDecimal.ZERO) == -1){ZVBEZ = BigDecimal.ZERO;}}
function MBERECH(){MZTABFB();
VFRB = ((ANP.add(FVB.add(FVBZ))).multiply(ZAHL100)).setScale(0, 1);
MLSTJAHR();
WVFRB = ((ZVE.subtract(GFB)).multiply(ZAHL100)).setScale(0, 1);
if(WVFRB.compareTo(BigDecimal.ZERO) == -1){WVFRB = BigDecimal.ZERO;}
LSTJAHR = (ST.multiply(BigDecimal.valueOf(f))).setScale(0,1);
UPLSTLZZ();
if(ZKF.compareTo(BigDecimal.ZERO) == 1){ZTABFB = ZTABFB.add(KFB);
MRE4ABZ();
MLSTJAHR();
JBMG = (ST.multiply(BigDecimal.valueOf(f))).setScale(0,1);}
else{JBMG = LSTJAHR;}
MSOLZ();}
function MZTABFB(){ANP= BigDecimal.ZERO;
if(ZVBEZ.compareTo (BigDecimal.ZERO) >= 0 && ZVBEZ.compareTo(FVBZ) == -1){FVBZ = BigDecimal.valueOf(ZVBEZ.longValue());}
if(STKL < 6){if(ZVBEZ.compareTo (BigDecimal.ZERO) == 1){if((ZVBEZ.subtract (FVBZ)).compareTo (BigDecimal.valueOf(p["MZTABFB_condition"])) == -1){ANP= (ZVBEZ.subtract (FVBZ)).setScale (0, 0);}
else{ANP= BigDecimal.valueOf(p["MZTABFB_ANP"]);}}}
else{FVBZ= BigDecimal.ZERO;
FVBZSO= BigDecimal.ZERO;}
if(STKL < 6){if(ZRE4.compareTo(ZVBEZ) == 1){if(ZRE4.subtract(ZVBEZ).compareTo(BigDecimal.valueOf(p["MZTABFB_condition_296"])) == -1){ANP = ANP.add(ZRE4).subtract(ZVBEZ).setScale(0,0);}
else{ANP = ANP.add(BigDecimal.valueOf(p["MZTABFB_ANP_297"]));}}}
KZTAB= 1;
if(STKL == 1){SAP= BigDecimal.valueOf(p["MZTABFB_SAP"]);
KFB= (ZKF.multiply (BigDecimal.valueOf(p["MZTABFB_KFB"]))).setScale (0, 1);}
else{if(STKL == 2){EFA= BigDecimal.valueOf(p["MZTABFB_EFA"]);
SAP= BigDecimal.valueOf(p["MZTABFB_SAP"]);
KFB= (ZKF.multiply (BigDecimal.valueOf(p["MZTABFB_KFB"]))).setScale (0, 1);}
else{if(STKL == 3){KZTAB= 2;
SAP= BigDecimal.valueOf(p["MZTABFB_SAP"]);
KFB= (ZKF.multiply (BigDecimal.valueOf(p["MZTABFB_KFB"]))).setScale (0, 1);}
else{if(STKL == 4){SAP= BigDecimal.valueOf(p["MZTABFB_SAP"]);
KFB= (ZKF.multiply (BigDecimal.valueOf(p["MZTABFB_KFB_301"]))).setScale (0, 1);}
else{if(STKL == 5){SAP= BigDecimal.valueOf(p["MZTABFB_SAP"]);
KFB= BigDecimal.ZERO;}
else{KFB= BigDecimal.ZERO;}}}}}
ZTABFB= (EFA.add (ANP).add (SAP).add (FVBZ)).setScale (2, 1);}
function MLSTJAHR(){UPEVP();
ZVE= ZRE4.subtract (ZTABFB).subtract(VSP);
UPMLST();}
function UPLSTLZZ(){JW = LSTJAHR.multiply(ZAHL100);
UPANTEIL();
LSTLZZ = ANTEIL1;}
function UPMLST(){if(ZVE.compareTo (ZAHL1) == -1){ZVE= BigDecimal.ZERO;
X= BigDecimal.ZERO;}
else{X= (ZVE.divide (BigDecimal.valueOf(KZTAB))).setScale (0, 1);}
if(STKL < 5){UPTAB26();}
else{MST5_6();}}
function UPEVP(){if(KRV == 1){VSPR = BigDecimal.ZERO;}
else{if(ZRE4VP.compareTo(BBGRVALV) == 1){ZRE4VPR = BBGRVALV;}
else{ZRE4VPR = ZRE4VP;}
VSPR = (ZRE4VPR.multiply(RVSATZAN)).setScale(2,1);}
MVSPKVPV();
if(ALV == 1){}
else{if(STKL == 6){}
else{MVSPHB();}}}
function MVSPKVPV(){if(ZRE4VP.compareTo(BBGKVPV) == 1){ZRE4VPR = BBGKVPV;}
else{ZRE4VPR = ZRE4VP;}
if(PKV > 0){if(STKL == 6){VSPKVPV = BigDecimal.ZERO;}
else{PKPVAGZJ = PKPVAGZ.multiply(ZAHL12).divide(ZAHL100).setScale(2,1);
VSPKVPV = PKPV.multiply(ZAHL12).divide(ZAHL100).setScale(2, 1);
VSPKVPV = VSPKVPV.subtract(PKPVAGZJ);
if(VSPKVPV.compareTo(BigDecimal.ZERO) == -1){VSPKVPV = BigDecimal.ZERO;}}}
else{VSPKVPV = ZRE4VPR.multiply(KVSATZAN.add(PVSATZAN)).setScale(2, 1);}
VSP = VSPKVPV.add(VSPR).setScale(0, 0);}
function MVSPHB(){if(ZRE4VP.compareTo(BBGRVALV) == 1){ZRE4VPR = BBGRVALV;}
else{ZRE4VPR = ZRE4VP;}
VSPALV = AVSATZAN.multiply(ZRE4VPR).setScale(2, 1);
VSPHB = VSPALV.add(VSPKVPV).setScale(2, 1);
if(VSPHB.compareTo(BigDecimal.valueOf(p["MVSPHB_condition"])) == 1){VSPHB = BigDecimal.valueOf(p["MVSPHB_VSPHB"]);}
VSPN = VSPR.add(VSPHB).setScale(0, 0);
if(VSPN.compareTo(VSP) == 1){VSP = VSPN;}}
function MST5_6(){ZZX= X;
if(ZZX.compareTo(W2STKL5) == 1){ZX= W2STKL5;
UP5_6();
if(ZZX.compareTo (W3STKL5) == 1){ST= (ST.add ((W3STKL5.subtract (W2STKL5)).multiply (BigDecimal.valueOf(p["MST5_6_ST"])))).setScale (0, 1);
ST= (ST.add ((ZZX.subtract (W3STKL5)).multiply (BigDecimal.valueOf(p["MST5_6_ST_305"])))).setScale (0, 1);}
else{ST= (ST.add ((ZZX.subtract (W2STKL5)).multiply (BigDecimal.valueOf(p["MST5_6_ST"])))).setScale (0, 1);}}
else{ZX= ZZX;
UP5_6();
if(ZZX.compareTo (W1STKL5) == 1){VERGL= ST;
ZX= W1STKL5;
UP5_6();
HOCH= (ST.add ((ZZX.subtract (W1STKL5)).multiply (BigDecimal.valueOf(p["MST5_6_HOCH"])))).setScale (0, 1);
if(HOCH.compareTo (VERGL) == -1){ST= HOCH;}
else{ST= VERGL;}}}}
function UP5_6(){X= (ZX.multiply (BigDecimal.valueOf(p["UP5_6_X"]))).setScale (0, 1);
UPTAB26();
ST1= ST;
X= (ZX.multiply (BigDecimal.valueOf(p["UP5_6_X_308"]))).setScale (0, 1);
UPTAB26();
ST2= ST;
DIFF= (ST1.subtract (ST2)).multiply (ZAHL2);
MIST= (ZX.multiply (BigDecimal.valueOf(p["UP5_6_MIST"]))).setScale (0, 1);
if(MIST.compareTo (DIFF) == 1){ST= MIST;}
else{ST= DIFF;}}
function MSOLZ(){SOLZFREI = (SOLZFREI.multiply(BigDecimal.valueOf(KZTAB)));
if(JBMG.compareTo (SOLZFREI) == 1){SOLZJ= (JBMG.multiply (BigDecimal.valueOf(p["MSOLZ_SOLZJ"]))).divide(ZAHL100).setScale(2, 1);
SOLZMIN= (JBMG.subtract (SOLZFREI)).multiply (BigDecimal.valueOf(p["MSOLZ_SOLZMIN"])).divide (ZAHL100).setScale (2, 1);
if(SOLZMIN.compareTo (SOLZJ) == -1){SOLZJ= SOLZMIN;}
JW= SOLZJ.multiply (ZAHL100).setScale (0, 1);
UPANTEIL();
SOLZLZZ= ANTEIL1;}
else{SOLZLZZ= BigDecimal.ZERO;}
if(R > 0){JW= JBMG.multiply (ZAHL100);
UPANTEIL();
BK= ANTEIL1;}
else{BK= BigDecimal.ZERO;}}
function UPANTEIL(){if(LZZ == 1){ANTEIL1= JW;}
else{if(LZZ == 2){ANTEIL1= JW.divide (ZAHL12, 0, 1);}
else{if(LZZ == 3){ANTEIL1= (JW.multiply (ZAHL7)).divide (ZAHL360, 0, 1);}
else{ANTEIL1= JW.divide (ZAHL360, 0, 1);}}}}
function MSONST(){LZZ = 1;
if(ZMVB == 0){ZMVB = 12;}
if(SONSTB.compareTo (BigDecimal.ZERO) == 0 && MBV.compareTo (BigDecimal.ZERO) == 0){LSTSO= BigDecimal.ZERO;
STS= BigDecimal.ZERO;
SOLZS= BigDecimal.ZERO;
BKS= BigDecimal.ZERO;}
else{MOSONST();
ZRE4J= ((JRE4.add (SONSTB)).divide (ZAHL100)).setScale (2, 1);
ZVBEZJ= ((JVBEZ.add (VBS)).divide (ZAHL100)).setScale (2, 1);
VBEZBSO= STERBE;
MRE4SONST();
MLSTJAHR();
WVFRBM = (ZVE.subtract(GFB)).multiply(ZAHL100).setScale(2,1);
if(WVFRBM.compareTo(BigDecimal.ZERO) == -1){WVFRBM = BigDecimal.ZERO;}
LSTSO= ST.multiply (ZAHL100);
STS = LSTSO.subtract(LSTOSO).multiply(BigDecimal.valueOf(f)).divide(ZAHL100, 0, 1).multiply(ZAHL100);
STSMIN();}}
function STSMIN(){if(STS.compareTo(BigDecimal.ZERO) == -1){if(MBV.compareTo(BigDecimal.ZERO) == 0){}
else{LSTLZZ = LSTLZZ.add(STS);
if(LSTLZZ.compareTo(BigDecimal.ZERO) == -1){LSTLZZ = BigDecimal.ZERO;}
SOLZLZZ = SOLZLZZ.add(STS.multiply(BigDecimal.valueOf(p["STSMIN_SOLZLZZ"]).divide(ZAHL100))).setScale(0, 1);
if(SOLZLZZ.compareTo(BigDecimal.ZERO) == -1){SOLZLZZ = BigDecimal.ZERO;}
BK = BK.add(STS);
if(BK.compareTo(BigDecimal.ZERO) == -1){BK = BigDecimal.ZERO;}}
STS = BigDecimal.ZERO;
SOLZS = BigDecimal.ZERO;}
else{MSOLZSTS();}
if(R > 0){BKS = STS;}
else{BKS = BigDecimal.ZERO;}}
function MSOLZSTS(){if(ZKF.compareTo(BigDecimal.ZERO) == 1){SOLZSZVE= ZVE.subtract(KFB);}
else{SOLZSZVE= ZVE;}
if(SOLZSZVE.compareTo(BigDecimal.ONE) == -1){SOLZSZVE= BigDecimal.ZERO;
X= BigDecimal.ZERO;}
else{X= SOLZSZVE.divide(BigDecimal.valueOf(KZTAB), 0, 1);}
if(STKL < 5){UPTAB26();}
else{MST5_6();}
SOLZSBMG= ST.multiply(BigDecimal.valueOf(f)).setScale(0,1);
if(SOLZSBMG.compareTo(SOLZFREI) == 1){SOLZS= STS.multiply(BigDecimal.valueOf(p["MSOLZSTS_SOLZS"])).divide(ZAHL100, 0, 1);}
else{SOLZS= BigDecimal.ZERO;}}
function MOSONST(){ZRE4J= (JRE4.divide (ZAHL100)).setScale (2, 1);
ZVBEZJ= (JVBEZ.divide (ZAHL100)).setScale (2, 1);
JLFREIB= JFREIB.divide (ZAHL100, 2, 1);
JLHINZU= JHINZU.divide (ZAHL100, 2, 1);
MRE4();
MRE4ABZ();
ZRE4VP = ZRE4VP.subtract(JRE4ENT.divide(ZAHL100));
MZTABFB();
VFRBS1 = ((ANP.add(FVB.add(FVBZ))).multiply(ZAHL100)).setScale(2,1);
MLSTJAHR();
WVFRBO = ((ZVE.subtract(GFB)).multiply(ZAHL100)).setScale(2, 1);
if(WVFRBO.compareTo(BigDecimal.ZERO) == -1 ){WVFRBO = BigDecimal.ZERO;}
LSTOSO= ST.multiply (ZAHL100);}
function MRE4SONST(){MRE4();
FVB= FVBSO;
MRE4ABZ();
ZRE4VP = ZRE4VP.add(MBV.divide(ZAHL100)).subtract(JRE4ENT.divide(ZAHL100)).subtract(SONSTENT.divide(ZAHL100));
FVBZ= FVBZSO;
MZTABFB();
VFRBS2 = ((((ANP.add(FVB).add(FVBZ))).multiply(ZAHL100))).subtract(VFRBS1);}
function UPTAB26(){if(X.compareTo(GFB.add(ZAHL1)) == -1){ST= BigDecimal.ZERO;}
else{if(X.compareTo (BigDecimal.valueOf(p["UPTAB26_condition"])) == -1){Y = (X.subtract(GFB)).divide(ZAHL10000, 6,1);
RW= Y.multiply (BigDecimal.valueOf(p["UPTAB26_RW"]));
RW= RW.add (BigDecimal.valueOf(p["UPTAB26_RW_316"]));
ST= (RW.multiply (Y)).setScale (0, 1);}
else{if(X.compareTo (BigDecimal.valueOf(p["UPTAB26_condition_317"])) == -1){Y= (X.subtract (BigDecimal.valueOf(p["UPTAB26_Y"]))).divide (ZAHL10000, 6, 1);
RW= Y.multiply (BigDecimal.valueOf(p["UPTAB26_RW_319"]));
RW= RW.add (BigDecimal.valueOf(p["UPTAB26_RW_320"]));
RW= RW.multiply (Y);
ST= (RW.add (BigDecimal.valueOf(p["UPTAB26_ST"]))).setScale (0, 1);}
else{if(X.compareTo (BigDecimal.valueOf(p["UPTAB26_condition_322"])) == -1){ST= ((X.multiply (BigDecimal.valueOf(p["UPTAB26_ST_323"]))).subtract (BigDecimal.valueOf(p["UPTAB26_ST_324"]))).setScale (0, 1);}
else{ST= ((X.multiply (BigDecimal.valueOf(p["UPTAB26_ST_325"]))).subtract (BigDecimal.valueOf(p["UPTAB26_ST_326"]))).setScale (0, 1);}}}}
ST= ST.multiply (BigDecimal.valueOf(KZTAB));}
MAIN();return {BK:Number(BK),BKS:Number(BKS),LSTLZZ:Number(LSTLZZ),SOLZLZZ:Number(SOLZLZZ),SOLZS:Number(SOLZS),STS:Number(STS),VFRB:Number(VFRB),VFRBS1:Number(VFRBS1),VFRBS2:Number(VFRBS2),WVFRB:Number(WVFRB),WVFRBO:Number(WVFRBO),WVFRBM:Number(WVFRBM)};
};
})(globalThis);