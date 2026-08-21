export const boxes=[
 {id:1,name:'Gereedschap & toilet',description:'Gereedschap, bevestiging en toiletartikelen',stalling:'Box 1'},
 {id:2,name:'Koken & schoonmaken',description:'Kookgerei en schoonmaakspullen',stalling:'Box 2'},
 {id:3,name:'Energie, douche & verlichting',description:'Stroom, douche en verlichting',stalling:'Box 3'},
 {id:4,name:'Wandelen & watersport',description:'Rugzakken en boottassen',stalling:'Thuis'},
 {id:5,name:'Dagelijks eten',description:'Variabele dagelijkse etensvoorraad',stalling:'Box 5'},
 {id:6,name:'Voorraad',description:'Eten, drinken en overige voorraad',stalling:'Box 6'}];
const lists={
1:['Haringen','Karabijnhaken','Multitools','Diverse haakjes','Hamers','Stanleymes','Elastiekjes','Klemmen','Gas','Ducttape','Reserveonderdelen bevestiging daktent','Kleine compressor voor banden','Opvouwbare schep','Zaagsel toilet','Paarse geur-afvalzakjes toilet','Hygiënische doekjes toilet','Stoffer en blik','Zwarte latex handschoenen'],
2:['Hoge pan','Fluitketel','Koekenpan','Vliegennetje','Pannensetje','Waslijntje op rol','Schoonmaakdoekjes','Plastic glazen en koffiebekers','Schoonmaakborstel voor jerrycans','Afwasborstel','Witte sproeier','Yoghurtbekers'],
3:['Doos met opladers','Aansluiting koelbox','Aansluiting zonnepaneel','USB-C voor Joyroom','Extra douche','Joyroom','Douchekraan','Koffiezetapparaat','Lamp/radio op zonne-energie','Lichtstrings','Anti-muggenlamp in groene hoes','Grijze emmer','Campingstroomkabel met verloopstekker','Clips voor handdoekjes'],
4:['Wandelrugzakken inclusief waterzak','Boottassen'],5:['Dagelijkse etensvoorraad'],6:['Voorraad eten','Voorraad drinken','Blikgroenten','Vuilniszakken','Schoonmaakdoekjes','Overige voorraad']};
const special={Multitools:2,Hamers:2,Gas:2,'Lichtstrings':2,'Wandelrugzakken inclusief waterzak':2,'Boottassen':2};
const travel=new Set(['Gas','Joyroom','Koffiezetapparaat','Wandelrugzakken inclusief waterzak','Boottassen']);
const makeItem=(id,name,extra={})=>({id,name,description:'',quantity:1,category:'Overig',box:null,storageLocation:'Thuis',travelLocation:'Mee te nemen',note:'',departure:false,checked:false,stock:'n.v.t.',photos:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),...extra});
export const items=[];
for(const [box,names] of Object.entries(lists)) for(const [i,name] of names.entries()) items.push(makeItem(`b${box}-${i}`,name,{quantity:special[name]||1,category:box==='1'?'Gereedschap':box==='2'?'Koken':box==='3'?'Energie':box==='4'?'Outdoor':box==='5'?'Eten':'Voorraad',box:Number(box),storageLocation:(name==='Joyroom'||name==='Koffiezetapparaat'||box==='4')?'Thuis':`Box ${box}`,travelLocation:`Box ${box}`,departure:travel.has(name),stock:box==='5'||box==='6'?'op voorraad':'n.v.t.'}));
for(const [i,name] of ['Wielkeggen in tas','Wild Land keuken','Yuna-luifel','Toilet','Douchetent','Stokken voor daktent','Stoelen','Tafel','Jerrycans met kraantje','Zwart-wit kleed','Grijze Action-vloerkleden'].entries()) items.push(makeItem(`loose-${i}`,name,{quantity:['Stoelen','Jerrycans met kraantje','Grijze Action-vloerkleden'].includes(name)?2:1,category:'Trailer',storageLocation:'Trailer los',travelLocation:'Trailer los'}));
for(const [i,name] of ['Koelboxoplader + wielklemmen','IKEA-tas met slaapzakken, kussens en dunne topper'].entries()) items.push(makeItem(`home-${i}`,name,{category:'Slapen',departure:true}));
for(const [i,name] of ['Kogeldrukmeter','Doos voor disselslot','Spanbanden','Zwarte kogel voor in dissel','Koelbox-autolader'].entries()) items.push(makeItem(`auto-${i}`,name,{category:'Auto',storageLocation:'Auto',travelLocation:'Auto',departure:['Kogeldrukmeter','Spanbanden'].includes(name)}));
export const categories=['Gereedschap','Koken','Energie','Outdoor','Eten','Voorraad','Trailer','Slapen','Auto'];
export const locations=['Box 1','Box 2','Box 3','Box 4','Box 5','Box 6','Trailer los','Thuis','Auto','Mee te nemen'];
