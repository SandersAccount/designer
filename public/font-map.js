// Global font map - moved outside function so it's accessible everywhere
const fontMap = {
    '8bit Tiny Retro': {
        regular: '/fonts/8bit-tiny-retro.ttf'
    },
    'Abril Fatface': {
        regular: '/fonts/AbrilFatface-Regular.ttf'
    },
    'Acme': {
        regular: '/fonts/Acme-Regular.ttf'
    },
    'Afacad Flux': {
        regular: '/fonts/AfacadFlux.ttf'
    },
    'Alfa Slab One': {
        regular: '/fonts/AlfaSlabOne-Regular.ttf'
    },
    'Aleo': {
        bold: '/fonts/aleo-bold-webfont.ttf',
        boldItalic: '/fonts/aleo-bolditalic-webfont.ttf',
        italic: '/fonts/aleo-italic-webfont.ttf',
        light: '/fonts/aleo-light-webfont.ttf',
        lightItalic: '/fonts/aleo-lightitalic-webfont.ttf',
        regular: '/fonts/aleo-regular-webfont.ttf'
    },
    'Allen Sans': {
        bold: '/fonts/AllenSans-Bold.ttf',
        regular: '/fonts/AllenSans-Regular.ttf'
    },
    'Alumni Sans SC': {
        regular: '/fonts/AlumniSansSC.ttf',
        bold: '/fonts/AlumniSansSC-Bold.ttf',
        boldItalic: '/fonts/AlumniSansSC-BoldItalic.ttf',
        italic: '/fonts/AlumniSansSC-Italic.ttf'
    },
    'Amaranth': {
        bold: '/fonts/Amaranth-Bold.ttf',
        boldItalic: '/fonts/Amaranth-BoldItalic.ttf',
        italic: '/fonts/Amaranth-Italic.ttf',
        regular: '/fonts/Amaranth-Regular.ttf'
    },
    'Amatic SC': {
        bold: '/fonts/AmaticSC-Bold.ttf',
        regular: '/fonts/AmaticSC-Regular.ttf'
    },
    'Anek Latin': {
        regular: '/fonts/AnekLatin.ttf',
        bold: '/fonts/AnekLatin-Bold.ttf'
    },
    'Anton': {
        regular: '/fonts/Anton-Regular.ttf'
    },
    'Aquifer': {
        regular: '/fonts/Aquifer.ttf'
    },
    'Are You Serious': {
        regular: '/fonts/AreYouSerious-Regular.ttf'
    },
    'Arial': {
        bold: '/fonts/ArialBold.ttf',
        regular: '/fonts/Arial.ttf',
        boldItalic: '/fonts/ArialBoldItalic.ttf',
        italic: '/fonts/ArialItalic.ttf'
    },
    'Audex': {
        italic: '/fonts/Audex-Italic.ttf',
        regular: '/fonts/Audex-Regular.ttf'
    },
    'Audiowide': {
        regular: '/fonts/Audiowide-Regular.ttf'
    },
    'Autobahn': {
        regular: '/fonts/Autobahn.ttf'
    },
    'Aventi': {
        bold: '/fonts/AventiBold.ttf'
    },
    'Averia Gruesa Libre': {
        regular: '/fonts/AveriaGruesaLibre-Regular.ttf'
    },
    'Averia Sans Libre': {
        bold: '/fonts/AveriaSansLibre-Bold.ttf',
        boldItalic: '/fonts/AveriaSansLibre-BoldItalic.ttf',
        italic: '/fonts/AveriaSansLibre-Italic.ttf',
        regular: '/fonts/AveriaSansLibre-Regular.ttf'
    },
    'Averia Serif Libre': {
        bold: '/fonts/AveriaSerifLibre-Bold.ttf',
        boldItalic: '/fonts/AveriaSerifLibre-BoldItalic.ttf',
        italic: '/fonts/AveriaSerifLibre-Italic.ttf',
        regular: '/fonts/AveriaSerifLibre-Regular.ttf'
    },
    'BStyle': {
        bold: '/fonts/BStyle_B.ttf',
        regular: '/fonts/BStyle_R.ttf'
    },
    'Bacasime Antique': {
        regular: '/fonts/BacasimeAntique-Regular.ttf'
    },
    'Badeen Display': {
        regular: '/fonts/BadeenDisplay-Regular.ttf'
    },
    'Bagel Fat One': {
        regular: '/fonts/BagelFatOne-Regular.ttf'
    },
    'Balhattan': {
        italic: '/fonts/Balhattan-Italic.ttf',
        regular: '/fonts/Balhattan-Regular.ttf'
    },
    'Bangers': {
        regular: '/fonts/Bangers-Regular.ttf'
    },
    'Barlow Condensed': {
        bold: '/fonts/BarlowCondensed-Bold.ttf',
        boldItalic: '/fonts/BarlowCondensed-BoldItalic.ttf',
        italic: '/fonts/BarlowCondensed-Italic.ttf',
        regular: '/fonts/BarlowCondensed-Regular.ttf'
    },
    'Barloesius Schrift': {
        regular: '/fonts/BarloesiusSchrift.ttf'
    },
    'Baskerville': {
        italic: '/fonts/Baskervville-Italic.ttf',
        regular: '/fonts/Baskervville-Regular.ttf'
    },
    'Bauhaus Homenaje': {
        regular: '/fonts/BAUHAUSHOMENAJE.ttf'
    },
    'Bazar': {
        regular: '/fonts/Bazar.ttf'
    },
    'Beatstreet': {
        regular: '/fonts/beatstreet.ttf'
    },
    'Bebas Neue': {
        regular: '/fonts/BebasNeue-Regular.ttf'
    },
    'Beirut': {
        ht: '/fonts/Beirut[ht].ttf'
    },
    'Belanosima': {
        bold: '/fonts/Belanosima-Bold.ttf',
        regular: '/fonts/Belanosima-Regular.ttf'
    },
    'Bertholdr Mainzer Fraktur': {
        regular: '/fonts/BertholdrMainzerFraktur.ttf'
    },
    'Beth Ellen': {
        regular: '/fonts/BethEllen-Regular.ttf'
    },
    'Bevan': {
        italic: '/fonts/Bevan-Italic.ttf',
        regular: '/fonts/Bevan-Regular.ttf'
    },
    'Bigelow Rules': {
        regular: '/fonts/BigelowRules-Regular.ttf'
    },
    'Bilbo': {
        regular: '/fonts/Bilbo-Regular.ttf'
    },
    'Bilbo Swash Caps': {
        regular: '/fonts/BilboSwashCaps-Regular.ttf'
    },
    'Birthstone Bounce': {
        regular: '/fonts/BirthstoneBounce-Regular.ttf'
    },
    'Bladerounded': {
        regular: '/fonts/Bladerounded-Regular.ttf'
    },
    'Block Mono': {
        bold: '/fonts/BlockMono-Bold.ttf',
        regular: '/fonts/BlockMono-Regular.ttf'
    },
    'Bodoni Moda': {
        regular: '/fonts/BodoniModa.ttf',
        '9ptBold': '/fonts/BodoniModa_9pt-Bold.ttf',
        ht: '/fonts/BodoniModaht.ttf',
        italic: '/fonts/BodoniModa-Italic.ttf'
    },
    'Bonbon': {
        regular: '/fonts/Bonbon-Regular.ttf'
    },
    'BoonTook': {
        italic: '/fonts/BoonTook-Italic.ttf',
        regular: '/fonts/BoonTook-Regular.ttf'
    },
    'BoonTook Mon': {
        italic: '/fonts/BoonTookMon-Italic.ttf',
        regular: '/fonts/BoonTookMon-Regular.ttf'
    },
    'Boogaloo': {
        regular: '/fonts/Boogaloo-Regular.ttf'
    },
    'Bowlby One SC': {
        regular: '/fonts/BowlbyOneSC-Regular.ttf'
    },
    'Brawler': {
        bold: '/fonts/Brawler-Bold.ttf',
        regular: '/fonts/Brawler-Regular.ttf'
    },
    'Bruno Ace SC': {
        regular: '/fonts/BrunoAceSC-Regular.ttf'
    },
    'Bubblegum Sans': {
        regular: '/fonts/BubblegumSans-Regular.ttf'
    },
    'Bungee': {
        regular: '/fonts/Bungee-Regular.ttf'
    },
    'CAT Engravers': {
        regular: '/fonts/CATEngravers.ttf'
    },
    'Cabin': {
        bold: '/fonts/Cabin-Bold-TTF.ttf',
        boldItalic: '/fonts/Cabin-BoldItalic-TTF.ttf',
        italic: '/fonts/Cabin-Italic-TTF.ttf',
        regular: '/fonts/Cabin-Regular-TTF.ttf'
    },
    'Cabin Condensed': {
        bold: '/fonts/CabinCondensed-Bold.ttf',
        regular: '/fonts/CabinCondensed-Regular.ttf'
    },
    'Caesar Dressing': {
        regular: '/fonts/CaesarDressing-Regular.ttf'
    },
    'Cagliostro': {
        regular: '/fonts/Cagliostro-Regular.ttf'
    },
    'Cal Sans': {
        regular: '/fonts/CalSans-Regular.ttf'
    },
    'Carter One': {
        regular: '/fonts/CarterOne-Regular.ttf'
    },
    'Castoro Titling': {
        regular: '/fonts/CastoroTitling-Regular.ttf'
    },
    'Catenary Stamp': {
        regular: '/fonts/Catenary-Stamp.ttf'
    },
    'Caveat Brush': {
        regular: '/fonts/CaveatBrush-Regular.ttf'
    },
    'Cello Sans': {
        bold: '/fonts/hinted-CelloSans-Bold.ttf',
        boldItalic: '/fonts/hinted-CelloSans-BoldItalic.ttf',
        italic: '/fonts/hinted-CelloSans-Italic.ttf',
        regular: '/fonts/hinted-CelloSans-Regular.ttf'
    },
    'Changa': {
        regular: '/fonts/Changa.ttf',
        bold: '/fonts/Changa-Bold.ttf'
    },
    'Chango': {
        regular: '/fonts/Chango-Regular.ttf'
    },
    'Chau Philomene One': {
        italic: '/fonts/ChauPhilomeneOne-Italic.ttf',
        regular: '/fonts/ChauPhilomeneOne-Regular.ttf'
    },
    'Cherry Bomb One': {
        regular: '/fonts/CherryBombOne-Regular.ttf'
    },
    'Cherry Cream Soda': {
        regular: '/fonts/CherryCreamSoda.ttf'
    },
    'Chewy': {
        regular: '/fonts/Chewy-Regular.ttf'
    },
    'Chicle': {
        regular: '/fonts/Chicle-Regular.ttf'
    },
    'Chisato': {
        regular: '/fonts/chisato.ttf'
    },
    'Cinzel': {
        bold: '/fonts/Cinzel-Bold.ttf',
        regular: '/fonts/Cinzel-Regular.ttf'
    },
    'Cinzel Decorative': {
        bold: '/fonts/CinzelDecorative-Bold.ttf',
        regular: '/fonts/CinzelDecorative-Regular.ttf'
    },
    'Climate Crisis': {
        regular: '/fonts/ClimateCrisis-Regular.ttf'
    },
    'Comforter': {
        regular: '/fonts/Comforter-Regular.ttf'
    },
    'Comforter Brush': {
        regular: '/fonts/ComforterBrush-Regular.ttf'
    },
    'Comic Sans MS': {
        regular: '/fonts/ComicSansMS.ttf',
        bold: '/fonts/ComicSansMSBold.ttf'
    },
    'Concert One': {
        regular: '/fonts/ConcertOne-Regular.ttf'
    },
    'Cookie': {
        regular: '/fonts/Cookie-Regular.ttf'
    },
    'Copilot': {
        regular: '/fonts/copilot.ttf'
    },
    'Copse': {
        regular: '/fonts/Copse-Regular.ttf'
    },
    'Corben': {
        bold: '/fonts/Corben-Bold.ttf',
        regular: '/fonts/Corben-Regular.ttf'
    },
    'Courier New': {
        regular: '/fonts/CourierNew.ttf',
        bold: '/fonts/CourierNewBold.ttf',
        boldItalic: '/fonts/CourierNewBoldItalic.ttf',
        italic: '/fonts/CourierNewItalic.ttf'
    },
    'Cramaten': {
        regular: '/fonts/cramaten.ttf'
    },
    'Creepster': {
        regular: '/fonts/Creepster-Regular.ttf'
    },
    'Croissant One': {
        regular: '/fonts/CroissantOne-Regular.ttf'
    },
    'Crosterian': {
        regular: '/fonts/Crosterian.ttf'
    },
    'Crossterian 513mZ': {
        regular: '/fonts/Crosterian-513mZ.ttf'
    },
    'Crushed': {
        regular: '/fonts/Crushed-Regular.ttf'
    },
    'CuteFont': {
        regular: '/fonts/CuteFont-Regular.ttf'
    },
    'Dancing Script': {
        regular: '/fonts/DancingScript.ttf',
        bold: '/fonts/DancingScript-Bold.ttf'
    },
    'Danfo': {
        claw: '/fonts/Danfo-Claw.ttf',
        comb: '/fonts/Danfo-Comb.ttf',
        regular: '/fonts/Danfo-Regular.ttf'
    },
    'Dangrek': {
        regular: '/fonts/Dangrek-Regular.ttf'
    },
    'Dashboard': {
        regular: '/fonts/Dashboard-Regular.ttf'
    },
    'Dashicons': {
        regular: '/fonts/dashicons.ttf'
    },
    'Days One': {
        regular: '/fonts/DaysOne-Regular.ttf'
    },
    'Delicious Handrawn': {
        regular: '/fonts/DeliciousHandrawn-Regular.ttf'
    },
    'Denk One': {
        regular: '/fonts/DenkOne-Regular.ttf'
    },
    'Diplomata SC': {
        regular: '/fonts/DiplomataSC-Regular.ttf'
    },
    'Durendal And Oliphant': {
        regular: '/fonts/DurendalAndOliphantRegular.ttf'
    },
    'DynaPuff': {
        regular: '/fonts/DynaPuff.ttf',
        condensedBold: '/fonts/DynaPuff_Condensed-Bold.ttf',
        condensedRegular: '/fonts/DynaPuff_Condensed-Regular.ttf',
        bold: '/fonts/DynaPuff-Bold.ttf'
    },
    'East Sea Dokdo': {
        regular: '/fonts/EastSeaDokdo-Regular.ttf'
    },
    'EB Garamond': {
        regular: '/fonts/EBGaramond.ttf',
        bold: '/fonts/EBGaramond-Bold.ttf',
        boldItalic: '/fonts/EBGaramond-BoldItalic.ttf',
        italic: '/fonts/EBGaramond-Italic.ttf'
    },
    'Economica': {
        boldItalic: '/fonts/Economica-BoldItalic.ttf',
        italic: '/fonts/Economica-Italic.ttf',
        regular: '/fonts/Economica-Regular.ttf'
    },
    'Eleventh Square': {
        regular: '/fonts/Eleventh-Square.ttf'
    },
    'Emilio 19': {
        regular: '/fonts/Emilio-19.ttf'
    },
    'Encode Sans SC': {
        regular: '/fonts/EncodeSansSC.ttf',
        bold: '/fonts/EncodeSansSC-Bold.ttf'
    },
    'Engagement': {
        regular: '/fonts/Engagement-Regular.ttf'
    },
    'Englebert': {
        regular: '/fonts/Englebert-Regular.ttf'
    },
    'Exetegue': {
        bold: '/fonts/Exetegue-Bold.ttf',
        regular: '/fonts/Exetegue-Regular.ttf'
    },
    'Exile': {
        regular: '/fonts/Exile-Regular.ttf'
    },
    'Exo': {
        bold: '/fonts/Exo-Bold.ttf',
        boldItalic: '/fonts/Exo-BoldItalic.ttf',
        italic: '/fonts/Exo-Italic.ttf',
        regular: '/fonts/Exo-Regular.ttf'
    },
    'Exo 2': {
        regular: '/fonts/Exo2.ttf',
        bold: '/fonts/Exo2-Bold.ttf',
        boldItalic: '/fonts/Exo2-BoldItalic.ttf',
        italic: '/fonts/Exo2-Italic.ttf'
    },
    'Fascinate': {
        regular: '/fonts/Fascinate-Regular.ttf'
    },
    'Festive': {
        regular: '/fonts/Festive-Regular.ttf'
    },
    'Fette National Fraktur': {
        regular: '/fonts/FetteNationalFraktur.ttf'
    },
    'Fjalla One': {
        regular: '/fonts/FjallaOne-Regular.ttf'
    },
    'Flavors': {
        regular: '/fonts/Flavors-Regular.ttf'
    },
    'Fontdiner Swanky': {
        regular: '/fonts/FontdinerSwanky-Regular.ttf'
    },
    'Fortzilla': {
        italic: '/fonts/Fortzilla-Italic.ttf',
        regular: '/fonts/Fortzilla-Regular.ttf'
    },
    'Francois One': {
        regular: '/fonts/FrancoisOne.ttf'
    },
    'Freckle Face': {
        regular: '/fonts/FreckleFace-Regular.ttf'
    },
    'Fredoka One': {
        regular: '/fonts/FredokaOne-Regular.ttf'
    },
    'Freeman': {
        regular: '/fonts/Freeman-Regular.ttf'
    },
    'Frijole': {
        regular: '/fonts/Frijole-Regular.ttf'
    },
    'Fugaz One': {
        regular: '/fonts/FugazOne-Regular.ttf'
    },
    'Funnel Display': {
        bold: '/fonts/FunnelDisplay-Bold.ttf',
        regular: '/fonts/FunnelDisplay-Regular.ttf'
    },
    'Furgatorio Sans': {
        regular: '/fonts/Furgatorio-Sans.ttf'
    },
    'Garamond': {
        regular: '/fonts/Garamond.ttf',
        italic: '/fonts/Garamond-Italic.ttf'
    },
    'Georgia': {
        regular: '/fonts/Georgia.ttf',
        bold: '/fonts/GeorgiaBold.ttf',
        boldItalic: '/fonts/GeorgiaBoldItalic.ttf',
        italic: '/fonts/GeorgiaItalic.ttf'
    },
    'Gloock': {
        regular: '/fonts/Gloock-Regular.ttf'
    },
    'Gloria Hallelujah': {
        regular: '/fonts/GloriaHallelujah-Regular.ttf'
    },
    'Gluten': {
        regular: '/fonts/Gluten.ttf',
        bold: '/fonts/Gluten-Bold.ttf'
    },
    'Goblin One': {
        regular: '/fonts/GoblinOne-Regular.ttf'
    },
    'Gochi Hand': {
        regular: '/fonts/GochiHand-Regular.ttf'
    },
    'Goli': {
        bold: '/fonts/Goli-Bold.ttf',
        vf: '/fonts/GoliVF.ttf',
        regular: '/fonts/Goli-Regular.ttf'
    },
    'Gorditas': {
        bold: '/fonts/Gorditas-Bold.ttf',
        regular: '/fonts/Gorditas-Regular.ttf'
    },
    'Gothica': {
        bold: '/fonts/Gothica-Bold.ttf',
        book: '/fonts/Gothica-Book.ttf'
    },
    'Graduate': {
        regular: '/fonts/Graduate-Regular.ttf'
    },
    'Gravitas One': {
        regular: '/fonts/GravitasOne-Regular.ttf'
    },
    'Gully': {
        bold: '/fonts/Gully-Bold.ttf',
        vf: '/fonts/GullyVF.ttf'
    },
    'Gyrochrome VF': {
        regular: '/fonts/GyrochromeVF.ttf'
    },
    'Hammersmith One': {
        regular: '/fonts/HammersmithOne-Regular.ttf'
    },
    'Hanalei Fill': {
        regular: '/fonts/HanaleiFill-Regular.ttf'
    },
    'Happy Monkey': {
        regular: '/fonts/HappyMonkey-Regular.ttf'
    },
    'Heavy Equipment': {
        regular: '/fonts/HeavyEquipment.ttf'
    },
    'Henny Penny': {
        regular: '/fonts/HennyPenny-Regular.ttf'
    },
    'Hepta Slab': {
        hairline: '/fonts/HeptaSlabHairline-Regular.ttf',
        vf: '/fonts/HeptaSlab-VF.ttf'
    },
    'Holtwood One SC': {
        regular: '/fonts/HoltwoodOneSC-Regular.ttf'
    },
    'Homemade Apple': {
        regular: '/fonts/HomemadeApple-Regular.ttf'
    },
    'Hyrax': {
        regular: '/fonts/hyrax.ttf'
    },
    'IBM Plex Serif': {
        bold: '/fonts/IBMPlexSerif-Bold.ttf',
        boldItalic: '/fonts/IBMPlexSerif-BoldItalic.ttf',
        italic: '/fonts/IBMPlexSerif-Italic.ttf',
        regular: '/fonts/IBMPlexSerif-Regular.ttf'
    },
    'IM Fel Pica': {
        italic: '/fonts/IMFelPica-Italic.ttf',
        regular: '/fonts/IMFelPica-Regular.ttf'
    },
    'IM Fell DW Pica': {
        italic: '/fonts/IMFellDWPica-Italic.ttf',
        regular: '/fonts/IMFellDWPica-Regular.ttf'
    },
    'Impact': {
        regular: '/fonts/Impact.ttf'
    },
    'Imperial': {
        regular: '/fonts/Imperial-Web.ttf'
    },
    'Inconsolata': {
        bold: '/fonts/Inconsolata-Bold.ttf',
        regular: '/fonts/Inconsolata-Regular.ttf'
    },
    'Inder': {
        regular: '/fonts/Inder-Regular.ttf'
    },
    'Inspiration': {
        regular: '/fonts/Inspiration-Regular.ttf'
    },
    'Inter': {
        regular: '/fonts/Inter.ttf',
        ht: '/fonts/Interht.ttf',
        italic: '/fonts/Inter-Italic.ttf',
        italicht: '/fonts/Inter-Italicht.ttf'
    },
    'Irish Grover': {
        regular: '/fonts/IrishGrover-Regular.ttf'
    },
    'Ignotum': {
        bold: '/fonts/Ignotum-Bold.ttf',
        boldItalic: '/fonts/Ignotum-BoldItalic.ttf',
        italic: '/fonts/Ignotum-Italic.ttf',
        regular: '/fonts/Ignotum-Regular.ttf'
    },
    'Jolly Lodger': {
        regular: '/fonts/JollyLodger-Regular.ttf'
    },
    'Jonova': {
        bold: '/fonts/Jonova-Bold.ttf',
        boldItalic: '/fonts/Jonova-BoldItalic.ttf',
        italic: '/fonts/Jonova-Italic.ttf',
        regular: '/fonts/Jonova-Regular.ttf'
    },
    'Jua': {
        regular: '/fonts/Jua-Regular.ttf'
    },
    'Just Another Hand': {
        regular: '/fonts/JustAnotherHand-Regular.ttf'
    },
    'Kablammo': {
        regularMorF: '/fonts/Kablammo-Regular-MORF.ttf'
    },
    'Karantina': {
        bold: '/fonts/Karantina-Bold.ttf',
        regular: '/fonts/Karantina-Regular.ttf'
    },
    'Karla': {
        bold: '/fonts/Karla-Bold.ttf',
        boldItalic: '/fonts/Karla-BoldItalic.ttf',
        italic: '/fonts/Karla-Italic.ttf',
        regular: '/fonts/Karla-Regular.ttf'
    },
    'Kaushan Script': {
        regular: '/fonts/KaushanScript-Regular.ttf'
    },
    'Keyes': {
        regular: '/fonts/keyes.ttf'
    },
    'Kranky': {
        regular: '/fonts/Kranky-Regular.ttf'
    },
    'Kristi': {
        regular: '/fonts/Kristi-Regular.ttf'
    },
    'LT Crow': {
        bold: '/fonts/LTCrow-Bold.ttf',
        regular: '/fonts/LTCrow-Regular.ttf'
    },
    'LT Hoodlum': {
        regular: '/fonts/LTHoodlum-Regular.ttf'
    },
    'LT Hoop': {
        bold: '/fonts/LTHoop-Bold.ttf',
        regular: '/fonts/LTHoop-Regular.ttf'
    },
    'LT Humor': {
        bold: '/fonts/LTHumor-Bold.ttf',
        boldItalic: '/fonts/LTHumor-BoldItalic.ttf',
        italic: '/fonts/LTHumor-Italic.ttf',
        regular: '/fonts/LTHumor-Regular.ttf'
    },
    'LT Museum': {
        bold: '/fonts/LTMuseum-Bold.ttf',
        boldItalic: '/fonts/LTMuseum-BoldItalic.ttf'
    },
    'LT Overflux': {
        regular: '/fonts/LTOverflux-Regular.ttf'
    },
    'LT Turbo': {
        regular: '/fonts/LTTurbo-Regular.ttf'
    },
    'Lakki Reddy': {
        regular: '/fonts/LakkiReddy-Regular.ttf'
    },
    'Lato': {
        bold: '/fonts/Lato-Bold.ttf',
        boldItalic: '/fonts/Lato-BoldItalic.ttf',
        italic: '/fonts/Lato-Italic.ttf',
        regular: '/fonts/Lato-Regular.ttf'
    },
    'League Gothic': {
        condensedRegular: '/fonts/LeagueGothic_Condensed-Regular.ttf',
        regular: '/fonts/LeagueGothic-Regular.ttf'
    },
    'Lexend Giga': {
        regular: '/fonts/LexendGiga.ttf',
        bold: '/fonts/LexendGiga-Bold.ttf'
    },
    'Lexend Tera': {
        bold: '/fonts/LexendTera-Bold.ttf',
        regular: '/fonts/LexendTera-Regular.ttf'
    },
    'Libre Baskerville': {
        bold: '/fonts/LibreBaskerville-Bold.ttf',
        italic: '/fonts/LibreBaskerville-Italic.ttf',
        regular: '/fonts/LibreBaskerville-Regular.ttf'
    },
    'Literata': {
        regular: '/fonts/Literata.ttf',
        bold: '/fonts/Literata-Bold.ttf',
        boldItalic: '/fonts/Literata-BoldItalic.ttf',
        italic: '/fonts/Literata-Italic.ttf'
    },
    'Lobster': {
        regular: '/fonts/Lobster-Regular.ttf'
    },
    'Lobster Two': {
        bold: '/fonts/LobsterTwo-Bold.ttf',
        boldItalic: '/fonts/LobsterTwo-BoldItalic.ttf',
        italic: '/fonts/LobsterTwo-Italic.ttf',
        regular: '/fonts/LobsterTwo-Regular.ttf'
    },
    'Londrina Solid': {
        regular: '/fonts/LondrinaSolid-Regular.ttf'
    },
    'Lora': {
        regular: '/fonts/Lora.ttf',
        bold: '/fonts/Lora-Bold.ttf',
        boldItalic: '/fonts/Lora-BoldItalic.ttf',
        italic: '/fonts/Lora-Italic.ttf'
    },
    'Loved by the King': {
        regular: '/fonts/LovedbytheKing-Regular.ttf'
    },
    'Love Ya Like A Sister': {
        regular: '/fonts/LoveYaLikeASister-Regular.ttf'
    },
    'Loxley': {
        regular: '/fonts/loxley.TTF'
    },
    'Luckiest Guy': {
        regular: '/fonts/LuckiestGuy-Regular.ttf'
    },
    'Macondo': {
        regular: '/fonts/Macondo-Regular.ttf'
    },
    'Manufacturing Consent': {
        regular: '/fonts/ManufacturingConsent-Regular.ttf'
    },
    'Manuskript Gothisch': {
        regular: '/fonts/ManuskriptGothisch.ttf'
    },
    'Mara Pfont': {
        regular: '/fonts/MaraPfont.ttf'
    },
    'Marcellus SC': {
        regular: '/fonts/MarcellusSC-Regular.ttf'
    },
    'Margariney Words': {
        bold: '/fonts/MargarineyWordsBold.ttf',
        regular: '/fonts/MargarineyWords.ttf'
    },
    'Martius': {
        italic: '/fonts/Martius-Italic.ttf',
        regular: '/fonts/Martius-Regular.ttf'
    },
    'Matemasie': {
        regular: '/fonts/Matemasie-Regular.ttf'
    },
    'Medula One': {
        regular: '/fonts/MedulaOne-Regular.ttf'
    },
    'Merriweather': {
        wdth: '/fonts/Merriweatherwdth.ttf'
    },
    'Michroma': {
        regular: '/fonts/Michroma.ttf'
    },
    'Midnight Letters': {
        regular: '/fonts/MidnightLetters.ttf',
        italic: '/fonts/MidnightLettersItalic.ttf'
    },
    'Modak': {
        regular: '/fonts/Modak-Regular.ttf'
    },
    'Moloko Font': {
        regular: '/fonts/molokofont.ttf'
    },
    'Monoton': {
        regular: '/fonts/Monoton-Regular.ttf'
    },
    'Montez': {
        regular: '/fonts/Montez-Regular.ttf'
    },
    'Montserrat Alternates': {
        bold: '/fonts/MontserratAlternates-Bold.ttf',
        regular: '/fonts/MontserratAlternates-Regular.ttf'
    },
    'Moonlit Flow': {
        regular: '/fonts/MoonlitFlow.ttf',
        italic: '/fonts/MoonlitFlowItalic.ttf'
    },
    'Mouse Memoirs': {
        regular: '/fonts/MouseMemoirs-Regular.ttf'
    },
    'Mr De Haviland': {
        regular: '/fonts/MrDeHaviland-Regular.ttf'
    },
    'Mystery Quest': {
        regular: '/fonts/MysteryQuest-Regular.ttf'
    },
    'Nerko One': {
        regular: '/fonts/NerkoOne-Regular.ttf'
    },
    'Norican': {
        regular: '/fonts/Norican-Regular.ttf'
    },
    'Nova Round': {
        regular: '/fonts/NovaRound.ttf'
    },
    'Nunito Sans': {
        regular: '/fonts/NunitoSans.ttf',
        italic: '/fonts/NunitoSans-Italic.ttf'
    },
    'Ode Erik': {
        regular: '/fonts/Ode-Erik.ttf'
    },
    'Oi': {
        regular: '/fonts/Oi-Regular.ttf'
    },
    'Ole': {
        regular: '/fonts/Ole-Regular.ttf'
    },
    'Oleo Script': {
        bold: '/fonts/OleoScript-Bold.ttf',
        regular: '/fonts/OleoScript-Regular.ttf'
    },
    'Orbitron': {
        bold: '/fonts/Orbitron-Bold.ttf',
        regular: '/fonts/Orbitron-Regular.ttf'
    },
    'Oregano': {
        italic: '/fonts/Oregano-Italic.ttf',
        regular: '/fonts/Oregano-Regular.ttf'
    },
    'Original Surfer': {
        regular: '/fonts/OriginalSurfer-Regular.ttf'
    },
    'Oswald': {
        regular: '/fonts/Oswald-.ttf',
        bold: '/fonts/Oswald-Bold.ttf'
    },
    'Outfit': {
        regular: '/fonts/Outfit-.ttf',
        bold: '/fonts/Outfit-Bold.ttf'
    },
    'Outward Block': {
        regular: '/fonts/outward-block.ttf'
    },
    'Outward Borders': {
        regular: '/fonts/outward-borders.ttf'
    },
    'Outward Round': {
        regular: '/fonts/outward-round.ttf'
    },
    'Overhaul': {
        regular: '/fonts/Overhaul.ttf'
    },
    'Oxanium': {
        bold: '/fonts/Oxanium-Bold.ttf',
        regular: '/fonts/Oxanium-Regular.ttf'
    },
    'Pacifico': {
        regular: '/fonts/Pacifico-Regular.ttf'
    },
    'Passion One': {
        bold: '/fonts/PassionOne-Bold.ttf',
        regular: '/fonts/PassionOne-Regular.ttf'
    },
    'Pathway Gothic One': {
        regular: '/fonts/PathwayGothicOne-Regular.ttf'
    },
    'Pattaya': {
        regular: '/fonts/Pattaya-Regular.ttf'
    },
    'Patua One': {
        regular: '/fonts/PatuaOne-Regular.ttf'
    },
    'Paytone One': {
        regular: '/fonts/PaytoneOne.ttf'
    },
    'Peace Sans': {
        regular: '/fonts/Peace-Sans-Webfont.ttf'
    },
    'Peralta': {
        regular: '/fonts/Peralta-Regular.ttf'
    },
    'Permanent Marker': {
        regular: '/fonts/PermanentMarker-Regular.ttf'
    },
    'Piedra': {
        regular: '/fonts/Piedra-Regular.ttf'
    },
    'Playfair Display': {
        regular: '/fonts/PlayfairDisplay-.ttf',
        bold: '/fonts/PlayfairDisplay-Bold.ttf',
        boldItalic: '/fonts/PlayfairDisplay-BoldItalic.ttf',
        italic: '/fonts/PlayfairDisplay-Italic.ttf'
    },
    'Playwrite IT Moderna': {
        regular: '/fonts/PlaywriteITModerna-Regular.ttf'
    },
    'Plus Jakarta Sans': {
        bold: '/fonts/PlusJakartaSans-Bold.ttf',
        boldItalic: '/fonts/PlusJakartaSans-BoldItalic.ttf',
        italic: '/fonts/PlusJakartaSans-Italic.ttf',
        regular: '/fonts/PlusJakartaSans-Regular.ttf'
    },
    'Podkova': {
        bold: '/fonts/Podkova-Bold.ttf',
        regular: '/fonts/Podkova-Regular.ttf',
        vf: '/fonts/Podkova-VF.ttf',
        romanVf: '/fonts/Podkova-Roman-VF.ttf'
    },
    'Pompiere': {
        regular: '/fonts/Pompiere-Regular.ttf'
    },
    'Poppins': {
        regular: '/fonts/Poppins-Regular.ttf'
    },
    'Portmanteau': {
        regular: '/fonts/Portmanteau-Regular.ttf'
    },
    'Potta One': {
        regular: '/fonts/PottaOne-Regular.ttf'
    },
    'Power': {
        regular: '/fonts/Power.ttf'
    },
    'Pretzel': {
        regular: '/fonts/PretzelRegular.ttf'
    },
    'Princess Sofia': {
        regular: '/fonts/PrincessSofia-Regular.ttf'
    },
    'Prosto One': {
        regular: '/fonts/ProstoOne-Regular.ttf'
    },
    'Protest Riot': {
        regular: '/fonts/ProtestRiot-Regular.ttf'
    },
    'Purple Purse': {
        regular: '/fonts/PurplePurse-Regular.ttf'
    },
    'Quicksand': {
        bold: '/fonts/Quicksand-Bold.ttf',
        regular: '/fonts/Quicksand-Regular.ttf'
    },
    'Qwigley': {
        regular: '/fonts/Qwigley-Regular.ttf'
    },
    'Raleway': {
        regular: '/fonts/Raleway-.ttf',
        bold: '/fonts/Raleway-Bold.ttf',
        boldItalic: '/fonts/Raleway-BoldItalic.ttf',
        italic: '/fonts/Raleway-Italic.ttf'
    },
    'Rammento One': {
        regular: '/fonts/RammentoOne-Regular.ttf'
    },
    'Ranchers': {
        regular: '/fonts/Ranchers-Regular.ttf'
    },
    'Remarcle': {
        regular: '/fonts/Remarcle.ttf'
    },
    'Ribeye Marrow': {
        regular: '/fonts/RibeyeMarrow-Regular.ttf'
    },
    'Righteous': {
        regular: '/fonts/Righteous-Regular.ttf'
    },
    'Risque': {
        regular: '/fonts/Risque-Regular.ttf'
    },
    'Road Rage': {
        regular: '/fonts/RoadRage-Regular.ttf'
    },
    'Roboto': {
        boldItalic: '/fonts/Roboto-BoldItalic.ttf',
        italic: '/fonts/Roboto-Italic.ttf',
        regular: '/fonts/Roboto-Regular.ttf'
    },
    'Roboto Slab': {
        bold: '/fonts/RobotoSlab-Bold.ttf',
        regular: '/fonts/RobotoSlab-Regular.ttf'
    },
    'Rochester': {
        regular: '/fonts/Rochester-Regular.ttf'
    },
    'Rock Salt': {
        regular: '/fonts/RockSalt-Regular.ttf'
    },
    'Rokkitt': {
        regular: '/fonts/Rokkitt.ttf',
        bold: '/fonts/Rokkitt-Bold.ttf',
        boldItalic: '/fonts/Rokkitt-BoldItalic.ttf',
        italic: '/fonts/Rokkitt-Italic.ttf'
    },
    'Rotunda Pommerania': {
        regular: '/fonts/Rotunda_Pommerania.ttf'
    },
    'Rubik': {
        regular: '/fonts/Rubik-.ttf',
        bold: '/fonts/Rubik-Bold.ttf',
        boldItalic: '/fonts/Rubik-BoldItalic.ttf',
        italic: '/fonts/Rubik-Italic.ttf'
    },
    'Rubik Bubbles': {
        regular: '/fonts/RubikBubbles-Regular.ttf'
    },
    'Rubik Dirt': {
        regular: '/fonts/Rubik-Dirt-Regular.ttf'
    },
    'Rubik Glitch': {
        regular: '/fonts/RubikGlitch-Regular.ttf'
    },
    'Rubik Mono One': {
        regular: '/fonts/RubikMonoOne-Regular.ttf'
    },
    'Rubik One': {
        regular: '/fonts/RubikOne-Regular.ttf'
    },
    'Rum Raisin': {
        regular: '/fonts/RumRaisin-Regular.ttf'
    },
    'Russo One': {
        regular: '/fonts/RussoOne-Regular.ttf'
    },
    'Ruthless Sketch': {
        regular: '/fonts/RuthlessSketch.ttf',
        italic: '/fonts/RuthlessSketchItalic.ttf'
    },
    'Sacramento': {
        regular: '/fonts/Sacramento-Regular.ttf'
    },
    'Saira Condensed': {
        bold: '/fonts/SairaCondensed-Bold.ttf',
        regular: '/fonts/SairaCondensed-Regular.ttf'
    },
    'Salsa': {
        regular: '/fonts/Salsa-Regular.ttf'
    },
    'Sangyo': {
        italic: '/fonts/Sangyo-Italic.ttf',
        regular: '/fonts/Sangyo-Regular.ttf'
    },
    'Saniretro': {
        regular: '/fonts/Saniretro.ttf'
    },
    'Sansita One': {
        regular: '/fonts/SansitaOne.ttf'
    },
    'Sarina': {
        regular: '/fonts/Sarina-Regular.ttf'
    },
    'Satisfy': {
        regular: '/fonts/Satisfy-Regular.ttf'
    },
    'Scratched Letters': {
        regular: '/fonts/ScratchedLetters.ttf'
    },
    'Secular One': {
        regular: '/fonts/SecularOne-Regular.ttf'
    },
    'Sedgwick Ave Display': {
        regular: '/fonts/SedgwickAveDisplay-Regular.ttf'
    },
    'Seymaz GX': {
        regular: '/fonts/SeymazGX.ttf',
        italic: '/fonts/SeymazGXslanted.ttf'
    },
    'Shrikhand': {
        regular: '/fonts/Shrikhand-Regular.ttf'
    },
    'Signwood': {
        italic: '/fonts/Signwood-Italic.ttf',
        regular: '/fonts/Signwood-Regular.ttf'
    },
    'Sikat': {
        regular: '/fonts/SIKAT.ttf'
    },
    'Single Day': {
        regular: '/fonts/SingleDay-Regular.ttf'
    },
    'Six Caps': {
        regular: '/fonts/SixCaps.ttf'
    },
    'Slackey': {
        regular: '/fonts/Slackey-Regular.ttf'
    },
    'Slim Jim': {
        regular: '/fonts/SlimJim.ttf'
    },
    'Sofia': {
        regular: '/fonts/Sofia-Regular.ttf'
    },
    'Sohoma': {
        extraBold: '/fonts/sohoma_extrabold.ttf',
        light: '/fonts/sohoma_light.ttf'
    },
    'Solway': {
        bold: '/fonts/Solway-Bold.ttf',
        regular: '/fonts/Solway-Regular.ttf'
    },
    'Source Sans Pro': {
        bold: '/fonts/SourceSansPro-Bold.ttf',
        boldItalic: '/fonts/SourceSansPro-BoldItalic.ttf',
        italic: '/fonts/SourceSansPro-Italic.ttf',
        regular: '/fonts/SourceSansPro-Regular.ttf'
    },
    'Special Elite': {
        regular: '/fonts/SpecialElite-Regular.ttf'
    },
    'Spectral SC': {
        bold: '/fonts/SpectralSC-Bold.ttf',
        boldItalic: '/fonts/SpectralSC-BoldItalic.ttf',
        italic: '/fonts/SpectralSC-Italic.ttf',
        regular: '/fonts/SpectralSC-Regular.ttf'
    },
    'Spectra SC': {
        bold: '/fonts/SpectraSC-Bold.ttf',
        boldItalic: '/fonts/SpectraSC-BoldItalic.ttf',
        italic: '/fonts/SpectraSC-Italic.ttf',
        regular: '/fonts/SpectraSC-Regular.ttf'
    },
    'Spicy Rice': {
        regular: '/fonts/SpicyRice-Regular.ttf'
    },
    'Squada One': {
        regular: '/fonts/SquadaOne-Regular.ttf'
    },
    'Stalemate': {
        regular: '/fonts/Stalemate-Regular.ttf'
    },
    'Sue Ellen Francisco': {
        regular: '/fonts/SueEllenFrancisco-Regular.ttf'
    },
    'Syncopate': {
        bold: '/fonts/Syncopate-Bold.ttf',
        regular: '/fonts/Syncopate-Regular.ttf'
    },
    'Tagesschrift': {
        regular: '/fonts/Tagesschrift-Regular.ttf'
    },
    'Teko': {
        bold: '/fonts/Teko-Bold.ttf',
        regular: '/fonts/Teko-Regular.ttf'
    },
    'Thernaly': {
        regular: '/fonts/Thernaly.ttf'
    },
    'Times New Roman': {
        regular: '/fonts/TimesNewRoman.ttf',
        bold: '/fonts/TimesNewRomanBold.ttf',
        boldItalic: '/fonts/TimesNewRomanBoldItalic.ttf',
        italic: '/fonts/TimesNewRomanItalic.ttf'
    },
    'Tiny MCE': {
        regular: '/fonts/tinymce.ttf',
        small: '/fonts/tinymce-small.ttf'
    },
    'Titan One': {
        regular: '/fonts/TitanOne-Regular.ttf'
    },
    'TMT Limkin VF': {
        regular: '/fonts/TMT-LimkinVF.ttf'
    },
    'Trade Winds': {
        regular: '/fonts/TradeWinds-Regular.ttf'
    },
    'Transit CAT': {
        regular: '/fonts/Transit-CAT.ttf'
    },
    'Trochut': {
        bold: '/fonts/Trochut-Bold.ttf',
        italic: '/fonts/Trochut-Italic.ttf',
        regular: '/fonts/Trochut-Regular.ttf'
    },
    'Tschichold': {
        bold: '/fonts/Tschichold-Bold.ttf',
        regular: '/fonts/Tschichold.ttf'
    },
    'Tulpen One': {
        regular: '/fonts/TulpenOne-Regular.ttf'
    },
    'Ubuntu': {
        bold: '/fonts/Ubuntu-Bold.ttf',
        boldItalic: '/fonts/Ubuntu-BoldItalic.ttf',
        italic: '/fonts/Ubuntu-Italic.ttf',
        regular: '/fonts/Ubuntu-Regular.ttf'
    },
    'Ultra': {
        regular: '/fonts/Ultra-Regular.ttf'
    },
    'Unbounded': {
        regular: '/fonts/Unbounded-.ttf',
        bold: '/fonts/Unbounded-Bold.ttf'
    },
    'Unifraktur Cook': {
        bold: '/fonts/UnifrakturCook-Bold.ttf'
    },
    'Utusi Star': {
        regular: '/fonts/Utusi_Star_Normal.ttf'
    },
    'Verdana': {
        regular: '/fonts/Verdana.ttf',
        bold: '/fonts/VerdanaBold.ttf',
        boldItalic: '/fonts/VerdanaBoldItalic.ttf',
        italic: '/fonts/VerdanaItalic.ttf'
    },
    'Vervelle Script': {
        regular: '/fonts/VervelleScript.ttf'
    },
    'Viga': {
        regular: '/fonts/Viga-Regular.ttf'
    },
    'Vina Sans': {
        regular: '/fonts/VinaSans-Regular.ttf'
    },
    'Voces': {
        regular: '/fonts/Voces-Regular.ttf'
    },
    'Warenhause Standard': {
        regular: '/fonts/Warenhause-Standard.ttf'
    },
    'Water Brush': {
        regular: '/fonts/WaterBrush-Regular.ttf'
    },
    'Westhorn': {
        italic: '/fonts/Westhorn-Italic.ttf',
        regular: '/fonts/Westhorn-Regular.ttf'
    },
    'Willow': {
        regular: '/fonts/willow.ttf'
    },
    'Winky Sans': {
        regular: '/fonts/WinkySans-.ttf',
        bold: '/fonts/WinkySans-Bold.ttf',
        boldItalic: '/fonts/WinkySans-BoldItalic.ttf',
        italic: '/fonts/WinkySans-Italic.ttf'
    },
    'Work Sans': {
        regular: '/fonts/WorkSans-.ttf',
        blackItalic: '/fonts/WorkSans-BlackItalic.ttf',
        bold: '/fonts/WorkSans-Bold.ttf',
        boldItalic: '/fonts/WorkSans-BoldItalic.ttf'
    },
    'Xanmono': {
        regular: '/fonts/Xanmono.ttf',
        italic: '/fonts/Xanmonoltallic.ttf'
    },
    'Yellowtail': {
        regular: '/fonts/Yellowtail-Regular.ttf'
    },
    'Yesteryear': {
        regular: '/fonts/Yesteryear-Regular.ttf'
    },
    'Zen Dots': {
        regular: '/fonts/ZenDots-Regular.ttf'
    }
};
