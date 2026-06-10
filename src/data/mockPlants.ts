import type { Plant } from '../types/garden';

export const MOCK_PLANTS: Plant[] = [
  {
    id: 'lavender-001',
    commonName: 'Lavender (Lavendel)',
    latinName: 'Lavandula angustifolia',
    description: 'A fragrant Mediterranean shrub known for its purple flower spikes and silvery-green foliage. / Een geurige mediterrane struik bekend om zijn paarse bloemaren en zilvergroene blad.',
    trimmingMatrix: [
      { month: 1, state: 'avoid', advice: 'No pruning in winter frost. / Geen snoei tijdens wintervorst.' },
      { month: 2, state: 'avoid', advice: 'No pruning in winter frost. / Geen snoei tijdens wintervorst.' },
      { month: 3, state: 'optimal', advice: 'Main pruning: Cut back hard to healthy growth after winter frost, but avoid cutting into old wood. / Hoofdsnoei: Snoei flink terug tot op het jonge groen na de wintervorst, snoei niet in het oude kale hout.' },
      { month: 4, state: 'optimal', advice: 'Shaping: Trim back new shoots slightly to encourage bushy growth. / Vormsnoei: Top jonge scheuten licht om een bossige plant te stimuleren.' },
      { month: 5, state: 'acceptable', advice: 'Light trimming of tips if needed. / Lichte vormsnoei indien nodig.' },
      { month: 6, state: 'acceptable', advice: 'Light trimming of tips if needed. / Lichte vormsnoei indien nodig.' },
      { month: 7, state: 'acceptable', advice: 'Light deadheading of early spent flowers. / Uitgebloeide vroege bloemen weghalen.' },
      { month: 8, state: 'optimal', advice: 'Summer pruning: Deadhead spent flowers and trim back stems by 1/3 to maintain shape. / Zomersnoei: Knip uitgebloeide bloemen en de bovenste 1/3 van de stengels weg voor vormbehoud.' },
      { month: 9, state: 'acceptable', advice: 'Light clean up of spent foliage, do not prune hard now. / Lichte opschoning van oud blad, snoei nu niet meer diep terug.' },
      { month: 10, state: 'avoid', advice: 'Avoid pruning now as new growth will be susceptible to frost. / Vermijd snoeien om vorstschade aan nieuwe jonge scheuten te voorkomen.' },
      { month: 11, state: 'avoid', advice: 'Avoid pruning in cold winter months. / Vermijd snoeien in koude wintermaanden.' },
      { month: 12, state: 'avoid', advice: 'Avoid pruning in cold winter months. / Vermijd snoeien in koude wintermaanden.' }
    ],
    defaultInstructions: {
      targetShoots: 'Spent flower stalks and top 1/3 of green foliage. / Uitgebloeide bloemen en bovenste 1/3 van het groen.',
      cutDepth: '2-3 inches above the woody base. / 5-8 cm boven het kale, houtige deel.',
      tools: ['Secateurs / Snoeischaar'],
      frostWarning: true
    }
  },
  {
    id: 'boxwood-001',
    commonName: 'Boxwood (Buxus)',
    latinName: 'Buxus sempervirens',
    description: 'A versatile evergreen shrub commonly used for hedges and topiary. / Een veelzijdige wintergroene struik die veel gebruikt wordt voor hagen en vormsnoei.',
    trimmingMatrix: [
      { month: 1, state: 'avoid', advice: 'Do not prune in winter. / Niet snoeien in de winter.' },
      { month: 2, state: 'avoid', advice: 'Do not prune in winter. / Niet snoeien in de winter.' },
      { month: 3, state: 'avoid', advice: 'Avoid pruning during early spring frost. / Niet snoeien tijdens vroege voorjaarsvorst.' },
      { month: 4, state: 'acceptable', advice: 'Light trim for neatness if necessary. / Lichte fatsoeneerbeurt indien nodig.' },
      { month: 5, state: 'optimal', advice: 'First main trim: Shape the new shoots after the first growth flush. Prune on a cloudy day to prevent leaf burn. / Eerste hoofdsnoei: Breng in model na de eerste groei-spurt. Snoei op een bewolkte dag tegen bladverbranding.' },
      { month: 6, state: 'optimal', advice: 'Shaping: Ideal time for topiary and hedge sharpening. / Vormsnoei: Ideale tijd voor het strak snoeien van hagen en vormsnoei.' },
      { month: 7, state: 'acceptable', advice: 'Light maintenance trimming. Avoid during hot, dry spells. / Lichte bijsnoei. Vermijd tijdens zeer hete en droge dagen.' },
      { month: 8, state: 'acceptable', advice: 'Light maintenance trimming. Avoid during hot, dry spells. / Lichte bijsnoei. Vermijd tijdens zeer hete en droge dagen.' },
      { month: 9, state: 'optimal', advice: 'Second main trim: Prune to tidy up hedges before winter dormancy. / Tweede hoofdsnoei: Snoei strak voor de winterrust.' },
      { month: 10, state: 'avoid', advice: 'Avoid pruning. New shoots won\'t harden off before winter. / Niet snoeien. Jonge scheuten harden niet op tijd uit voor de vorst.' },
      { month: 11, state: 'avoid', advice: 'Do not prune in winter. / Niet snoeien in de winter.' },
      { month: 12, state: 'avoid', advice: 'Do not prune in winter. / Niet snoeien in de winter.' }
    ],
    defaultInstructions: {
      targetShoots: 'Outer tips and new shoots to maintain form. / Buitenste scheuten en jonge takjes voor vormbehoud.',
      cutDepth: 'Top 1-2 inches of growth. / Bovenste 2-5 cm van de scheuten.',
      tools: ['Hedge shears / Heggenschaar', 'Topiary shears / Buxusschaar'],
      frostWarning: false
    }
  },
  {
    id: 'hydrangea-001',
    commonName: 'Hydrangea (Hortensia)',
    latinName: 'Hydrangea macrophylla',
    description: 'Famous for its large, colorful flower heads. Pruning depends on old/new wood flowering. / Beroemd om zijn grote, kleurrijke bloemschermen. Snoei hangt af van bloei op oud of nieuw hout.',
    trimmingMatrix: [
      { month: 1, state: 'avoid', advice: 'Leave spent flower heads to protect buds from frost. / Laat oude bloemhoofden zitten ter bescherming tegen vorst.' },
      { month: 2, state: 'avoid', advice: 'Leave spent flower heads to protect buds from frost. / Laat oude bloemhoofden zitten ter bescherming tegen vorst.' },
      { month: 3, state: 'optimal', advice: 'Spring clean-up: Prune old flower heads back to the first pair of healthy, fat buds. / Voorjaarssnoei: Knip de oude bloemen weg net boven het eerste paar gezonde, dikke knoppen.' },
      { month: 4, state: 'optimal', advice: 'Remove thin, weak, or dead stems to stimulate airflow and strong growth. / Verwijder dunne, zwakke of dode takken om lucht en sterke groei te bevorderen.' },
      { month: 5, state: 'avoid', advice: 'Do not prune now as you will cut off developing flower buds. / Snoei nu niet omdat je de bloemknoppen voor dit jaar wegsnijdt.' },
      { month: 6, state: 'avoid', advice: 'Do not prune during flowering. / Niet snoeien tijdens de bloei.' },
      { month: 7, state: 'avoid', advice: 'Do not prune during flowering. / Niet snoeien tijdens de bloei.' },
      { month: 8, state: 'avoid', advice: 'Do not prune during flowering. / Niet snoeien tijdens de bloei.' },
      { month: 9, state: 'avoid', advice: 'Leave faded flowers to dry on the plant. / Laat uitgebloeide bloemen aan de plant drogen.' },
      { month: 10, state: 'avoid', advice: 'Do not prune before winter. / Niet snoeien voor de winter.' },
      { month: 11, state: 'avoid', advice: 'Do not prune before winter. / Niet snoeien voor de winter.' },
      { month: 12, state: 'avoid', advice: 'Do not prune before winter. / Niet snoeien voor de winter.' }
    ],
    defaultInstructions: {
      targetShoots: 'Old flower heads and dead wood. / Oude bloemhoofden en dood hout.',
      cutDepth: 'Just above a strong pair of buds. / Vlak boven het eerste paar gezonde knoppen.',
      tools: ['Secateurs / Snoeischaar'],
      frostWarning: true
    }
  },
  {
    id: 'apple-001',
    commonName: 'Apple Tree (Appelboom)',
    latinName: 'Malus domestica',
    description: 'A popular deciduous fruit tree. Winter pruning encourages strong vegetative growth, summer pruning encourages fruiting. / Populaire fruitboom. Wintersnoei stimuleert sterke groei, zomersnoei stimuleert fruitvorming.',
    trimmingMatrix: [
      { month: 1, state: 'optimal', advice: 'Winter pruning: Ideal time to prune dormant trees. Remove dead, diseased, and crossing branches. Cut back main branches to shape. / Wintersnoei: Ideale tijd om te snoeien. Verwijder dood, ziek en kruisend hout. Snoei hoofdtakken in model.' },
      { month: 2, state: 'optimal', advice: 'Winter pruning: Continue pruning dormant branches on frost-free days. / Wintersnoei: Snoei verder op vorstvrije dagen.' },
      { month: 3, state: 'acceptable', advice: 'Late winter pruning: Can still be done early in the month before sap starts running. / Late wintersnoei: Kan nog net begin maart voor het op gang komen van de sapstroom.' },
      { month: 4, state: 'avoid', advice: 'Avoid pruning during bud break and flowering to prevent disease entrance. / Vermijd snoei tijdens knopuitbraak en bloei wegens ziektegevoeligheid.' },
      { month: 5, state: 'avoid', advice: 'Avoid pruning. / Vermijd snoei.' },
      { month: 6, state: 'avoid', advice: 'Avoid pruning. / Vermijd snoei.' },
      { month: 7, state: 'acceptable', advice: 'Summer pruning: Remove water shoots (upright fast-growing branches) to let light reach ripening fruit. / Zomersnoei: Snoei rechtopstaande waterloten weg zodat er licht bij het fruit komt.' },
      { month: 8, state: 'optimal', advice: 'Summer pruning: Trim back new shoots to 3-4 leaves to encourage fruit buds next year. / Zomersnoei: Snoei nieuwe scheuten terug tot op 3-4 bladeren om bloemknoppen voor volgend jaar te vormen.' },
      { month: 9, state: 'acceptable', advice: 'Light pruning to clear fruit, but do not prune hard. / Lichte snoei om fruit te ontbloten, maar snoei niet hard.' },
      { month: 10, state: 'avoid', advice: 'Do not prune. Open wounds will be susceptible to silver leaf disease and autumn frost. / Niet snoeien. Open wonden zijn vatbaar voor loodglansschimmel en vroege vorst.' },
      { month: 11, state: 'avoid', advice: 'Avoid pruning. Wait for dormancy. / Vermijd snoei. Wacht tot de boom in rust is.' },
      { month: 12, state: 'optimal', advice: 'Winter pruning: Prune dormant tree. Maintain an open center for light and air. / Wintersnoei: Begin met snoeien van de slapende boom. Zorg voor een open kroon.' }
    ],
    defaultInstructions: {
      targetShoots: 'Water shoots, dead wood, crossing branches. / Waterloten, dood hout, schurende en kruisende takken.',
      cutDepth: 'Prune side shoots back to 3-4 buds. / Snoei zijtakken terug tot op 3-4 knoppen (ogen).',
      tools: ['Pruning shears / Snoeischaar', 'Loppers / Takkenschaar', 'Pruning saw / Snoeizaag'],
      frostWarning: true
    }
  },
  {
    id: 'pear-001',
    commonName: 'Pear Tree (Peerboom)',
    latinName: 'Pyrus communis',
    description: 'Deciduous fruit tree similar to apple. Requires winter structural pruning and summer light trimming to direct energy to fruits. / Fruitboom vergelijkbaar met appel. Vereist wintersnoei voor structuur en zomersnoei om energie naar vruchten te sturen.',
    trimmingMatrix: [
      { month: 1, state: 'optimal', advice: 'Winter pruning: Prune dormant branches. Open up the canopy to maximize light. / Wintersnoei: Snoei de slapende boom. Zorg voor licht en lucht in de kroon.' },
      { month: 2, state: 'optimal', advice: 'Winter pruning: Shape and thin branches on frost-free days. / Wintersnoei: Vorm en dun uit op vorstvrije dagen.' },
      { month: 3, state: 'acceptable', advice: 'Late winter pruning: Prune before leaf buds swell. / Late wintersnoei: Snoei voor het zwellen van de bladknoppen.' },
      { month: 4, state: 'avoid', advice: 'Do not prune during leaf burst and flowering. / Niet snoeien tijdens uitlopen en bloei.' },
      { month: 5, state: 'avoid', advice: 'Do not prune. / Niet snoeien.' },
      { month: 6, state: 'avoid', advice: 'Do not prune. / Niet snoeien.' },
      { month: 7, state: 'acceptable', advice: 'Summer pruning: Cut back vertical water shoots to encourage fruit buds. / Zomersnoei: Snoei verticale waterloten weg om vorming van bloemknoppen te stimuleren.' },
      { month: 8, state: 'optimal', advice: 'Summer pruning: Shorten leafy shoots to direct energy to developing pears. / Zomersnoei: Kort bladrijke scheuten in om energie naar de peren te sturen.' },
      { month: 9, state: 'acceptable', advice: 'Light pruning only. / Alleen zeer lichte snoei.' },
      { month: 10, state: 'avoid', advice: 'Do not prune now due to frost risk. / Niet snoeien wegens vorst- en schimmelrisico.' },
      { month: 11, state: 'avoid', advice: 'Avoid pruning. Wait for dormancy. / Vermijd snoeien. Wacht op winterrust.' },
      { month: 12, state: 'optimal', advice: 'Winter pruning: Start dormant pruning on clear dry days. / Wintersnoei: Begin met wintersnoei op droge dagen.' }
    ],
    defaultInstructions: {
      targetShoots: 'Upright water shoots, dead and diseased wood. / Waterloten, dood en ziek hout.',
      cutDepth: 'Trim side shoots to 3-4 buds (about 10 cm). / Zijscheuten inkorten tot op 3-4 knoppen (ca. 10 cm).',
      tools: ['Pruning shears / Snoeischaar', 'Loppers / Takkenschaar', 'Pruning saw / Snoeizaag'],
      frostWarning: true
    }
  },
  {
    id: 'plum-001',
    commonName: 'Plum Tree (Pruimenboom)',
    latinName: 'Prunus domestica',
    description: 'A stone fruit tree. WARNING: Pruning in winter carries a severe risk of Silver Leaf disease (loodglans). Prune only in late spring/summer. / Steenvrucht. LET OP: Wintersnoei geeft groot risico op loodglansschimmel. Snoei uitsluitend in het late voorjaar of de zomer.',
    trimmingMatrix: [
      { month: 1, state: 'bleeding_risk', advice: 'CRITICAL WARNING: Never prune plum trees in winter due to Silver Leaf disease risk. / DANGER: Snoei nooit in de winter vanwege het grote risico op loodglansschimmel!' },
      { month: 2, state: 'bleeding_risk', advice: 'CRITICAL WARNING: Never prune plum trees in winter due to Silver Leaf disease risk. / DANGER: Snoei nooit in de winter vanwege het grote risico op loodglansschimmel!' },
      { month: 3, state: 'avoid', advice: 'Avoid pruning. Wait for warmer weather. / Vermijd snoei. Wacht op warmer weer.' },
      { month: 4, state: 'acceptable', advice: 'Late spring pruning: Can be done now if weather is warm and dry. / Voorjaarssnoei: Kan bij droog, warm weer eind april.' },
      { month: 5, state: 'optimal', advice: 'Pruning: Best time to prune young trees as growth begins and wounds heal quickly. / Snoei: Uitstekende tijd voor jonge bomen omdat wonden nu snel herstellen.' },
      { month: 6, state: 'optimal', advice: 'Pruning: Good time to prune and thin out crossing branches. / Snoei: Goede periode voor uitdunnen en vormsnoei.' },
      { month: 7, state: 'optimal', advice: 'Summer pruning: Prune after harvest. Highly recommended to maintain shape and size. / Zomersnoei: Snoei direct na de oogst. Zeer aanbevolen voor vormbehoud.' },
      { month: 8, state: 'optimal', advice: 'Summer pruning: Prune after harvest. Wounds heal very quickly now. / Zomersnoei: Snoei na de oogst. Wonden genezen nu zeer snel.' },
      { month: 9, state: 'acceptable', advice: 'Pruning can be done early in the month, but avoid if wet. / Snoei kan nog begin september, mits het droog weer is.' },
      { month: 10, state: 'avoid', advice: 'Avoid pruning. Wet and cold weather increases disease risk. / Vermijd snoeien. Nat en koud weer verhoogt infectiegevaar.' },
      { month: 11, state: 'bleeding_risk', advice: 'CRITICAL WARNING: Severe risk of Silver Leaf disease in winter months. / DANGER: Groot risico op loodglansschimmel in wintermaanden.' },
      { month: 12, state: 'bleeding_risk', advice: 'CRITICAL WARNING: Severe risk of Silver Leaf disease in winter months. / DANGER: Groot risico op loodglansschimmel in wintermaanden.' }
    ],
    defaultInstructions: {
      targetShoots: 'Dead wood, crossing branches, vertical water shoots. / Dood hout, kruisende takken, verticale waterloten.',
      cutDepth: 'Cut back new shoots to a healthy leaf bud. / Kort jonge scheuten in tot op een gezonde bladknop.',
      tools: ['Pruning shears / Snoeischaar', 'Loppers / Takkenschaar'],
      frostWarning: false
    }
  },
  {
    id: 'peach-001',
    commonName: 'Peach Tree (Perzikboom)',
    latinName: 'Prunus persica',
    description: 'A stone fruit tree that flowers on 1-year-old wood. Pruning should be done in spring as buds open, to identify fruit-bearing wood. / Steenvrucht die bloeit op 1-jarig hout. Snoei in het voorjaar bij het uitlopen om vruchthout te herkennen.',
    trimmingMatrix: [
      { month: 1, state: 'bleeding_risk', advice: 'Do not prune in winter. High risk of disease and dieback. / Niet snoeien in de winter. Groot risico op ziektes en taksterfte.' },
      { month: 2, state: 'bleeding_risk', advice: 'Do not prune in winter. / Niet snoeien in de winter.' },
      { month: 3, state: 'avoid', advice: 'Wait for buds to swell. / Wacht tot de knoppen zwellen.' },
      { month: 4, state: 'optimal', advice: 'Spring pruning: Best time. Prune as the pink buds open. You can clearly see flower buds (round) vs leaf buds (pointed). / Voorjaarssnoei: Beste tijd. Snoei als de roze knoppen openen om vruchthout te selecteren.' },
      { month: 5, state: 'acceptable', advice: 'Can prune early shoots, thin out excess small fruits. / Vroege scheuten snoeien, overtollige kleine vruchten uitdunnen.' },
      { month: 6, state: 'avoid', advice: 'Avoid hard pruning. / Vermijd harde snoei.' },
      { month: 7, state: 'acceptable', advice: 'Summer pruning: Remove water shoots to improve sunlight penetration. / Zomersnoei: Waterloten weghalen voor betere lichtinval.' },
      { month: 8, state: 'optimal', advice: 'Post-harvest pruning: Clean up and shape after harvesting fruit. / Snoei na de oogst: Opschonen en snoeien na het plukken.' },
      { month: 9, state: 'avoid', advice: 'Do not prune late in the season. / Snoei niet te laat in het seizoen.' },
      { month: 10, state: 'avoid', advice: 'Do not prune. / Niet snoeien.' },
      { month: 11, state: 'bleeding_risk', advice: 'Avoid winter pruning. / Wintersnoei vermijden.' },
      { month: 12, state: 'bleeding_risk', advice: 'Avoid winter pruning. / Wintersnoei vermijden.' }
    ],
    defaultInstructions: {
      targetShoots: 'Remove 2-year-old shoots that have already fruited, keep young 1-year-old shoots. / Verwijder 2-jarig uitgebloeid hout, behoud 1-jarige scheuten.',
      cutDepth: 'Prune back to replacement shoots near the main branches. / Snoei terug tot op vervangende scheuten nabij de hoofdtakken.',
      tools: ['Pruning shears / Snoeischaar'],
      frostWarning: true
    }
  },
  {
    id: 'cherry-001',
    commonName: 'Cherry Tree (Kersenboom)',
    latinName: 'Prunus avium',
    description: 'A stone fruit tree. Extremely sensitive to bacterial canker and silver leaf disease if pruned in winter. Prune in summer post-harvest. / Steenvruchtboom. Zeer gevoelig voor bacteriekanker en loodglans bij wintersnoei. Snoei in de zomer na de oogst.',
    trimmingMatrix: [
      { month: 1, state: 'bleeding_risk', advice: 'CRITICAL WARNING: Never prune cherry trees in winter due to severe disease risk. / DANGER: Snoei nooit kersenbomen in de winter wegens infectiegevaar.' },
      { month: 2, state: 'bleeding_risk', advice: 'CRITICAL WARNING: Never prune cherry trees in winter. / DANGER: Snoei nooit kersenbomen in de winter.' },
      { month: 3, state: 'avoid', advice: 'Do not prune. / Niet snoeien.' },
      { month: 4, state: 'avoid', advice: 'Avoid pruning. / Vermijd snoeien.' },
      { month: 5, state: 'acceptable', advice: 'Can prune young trees lightly if weather is warm and dry. / Jonge bomen kunnen licht gesnoeid worden bij warm, droog weer.' },
      { month: 6, state: 'acceptable', advice: 'Can prune lightly. / Lichte snoei mogelijk.' },
      { month: 7, state: 'optimal', advice: 'Summer pruning: Ideal time is right after harvest. Wounds heal quickly and disease pressure is low. / Zomersnoei: Ideale tijd is direct na de oogst. Wonden genezen snel.' },
      { month: 8, state: 'optimal', advice: 'Summer pruning: Prune after harvest. Thin out branches to prevent overcrowding. / Zomersnoei: Snoei na de oogst. Dun takken uit voor lichttoetreding.' },
      { month: 9, state: 'acceptable', advice: 'Prune early in the month if dry. / Kan nog begin september bij droog weer.' },
      { month: 10, state: 'avoid', advice: 'Avoid pruning. / Vermijd snoei.' },
      { month: 11, state: 'bleeding_risk', advice: 'CRITICAL WARNING: Do not prune in winter. / DANGER: Niet snoeien in de winter.' },
      { month: 12, state: 'bleeding_risk', advice: 'CRITICAL WARNING: Do not prune in winter. / DANGER: Niet snoeien in de winter.' }
    ],
    defaultInstructions: {
      targetShoots: 'Crossing, dead, or diseased branches. Avoid removing too much healthy wood. / Kruisende, dode of zieke takken. Voorkom te veel snoeien.',
      cutDepth: 'Cut back to a strong outward-facing lateral branch. / Snoei terug tot op een sterke, naar buiten gerichte zijtak.',
      tools: ['Pruning shears / Snoeischaar', 'Loppers / Takkenschaar'],
      frostWarning: false
    }
  },
  {
    id: 'fig-001',
    commonName: 'Fig Tree (Vijgenboom)',
    latinName: 'Ficus carica',
    description: 'A robust tree with large lobed leaves. Prune in late winter while dormant. Protect fresh cuts from severe frost. / Robuuste boom met grote gelobde bladeren. Snoei in de late winter tijdens rust. Bescherm snoeiwonden tegen strenge vorst.',
    trimmingMatrix: [
      { month: 1, state: 'avoid', advice: 'Too cold. Pruning now may cause winter damage. / Te koud. Snoeien nu kan winterinvalschade veroorzaken.' },
      { month: 2, state: 'optimal', advice: 'Late winter pruning: Best time when dormant but frost is not severe. / Late wintersnoei: Beste tijd tijdens rust als de strengste vorst voorbij is.' },
      { month: 3, state: 'optimal', advice: 'Early spring pruning: Clean up dead tips and shape before sap flow starts. / Vroeg voorjaar: Dode toppen wegsnoeien en vormgeven voor de sapstroom begint.' },
      { month: 4, state: 'bleeding_risk', advice: 'Pruning now causes heavy bleeding of white milky sap. Avoid. / Snoeien nu leidt tot hevig bloeden van wit melksap. Vermijden.' },
      { month: 5, state: 'avoid', advice: 'Avoid pruning. Sap is flowing. / Vermijd snoeien wegens sapstroom.' },
      { month: 6, state: 'acceptable', advice: 'Summer pinching: Pinch out tips of new shoots to encourage fig development. / Zomersnoei: Top jonge scheuten om de vruchtontwikkeling te stimuleren.' },
      { month: 7, state: 'acceptable', advice: 'Summer pinching: Remove excess foliage to let light reach developing figs. / Zomersnoei: Haal overtollig blad weg zodat er zon op de vijgen valt.' },
      { month: 8, state: 'avoid', advice: 'Avoid pruning. / Vermijd snoei.' },
      { month: 9, state: 'avoid', advice: 'Do not prune. / Niet snoeien.' },
      { month: 10, state: 'avoid', advice: 'Do not prune. / Niet snoeien.' },
      { month: 11, state: 'avoid', advice: 'Avoid pruning. Wait for dormancy. / Vermijd snoei. Wacht op winterrust.' },
      { month: 12, state: 'avoid', advice: 'Avoid pruning. / Vermijd snoei.' }
    ],
    defaultInstructions: {
      targetShoots: 'Remove crossing branches and frost-damaged tips. / Verwijder kruisende takken en door vorst beschadigde toppen.',
      cutDepth: 'Cut back to an outward-facing bud. / Snoei terug tot een naar buiten gerichte knop.',
      tools: ['Pruning shears / Snoeischaar', 'Loppers / Takkenschaar'],
      frostWarning: true
    }
  },
  {
    id: 'apricot-001',
    commonName: 'Apricot Tree (Abrikozenboom)',
    latinName: 'Prunus armeniaca',
    description: 'Stone fruit similar to peach. Prune in late spring or summer. Never prune in winter due to risk of dieback. / Steenvruchtboom vergelijkbaar met perzik. Snoei in de late lente of zomer. Snoei nooit in de winter wegens taksterfte.',
    trimmingMatrix: [
      { month: 1, state: 'bleeding_risk', advice: 'CRITICAL WARNING: Never prune in winter. High risk of disease and dieback. / DANGER: Snoei nooit in de winter wegens groot risico op schimmels en taksterfte.' },
      { month: 2, state: 'bleeding_risk', advice: 'CRITICAL WARNING: Never prune in winter. / DANGER: Snoei nooit in de winter.' },
      { month: 3, state: 'avoid', advice: 'Avoid pruning. Wait for warm weather. / Vermijd snoei. Wacht op warmer weer.' },
      { month: 4, state: 'acceptable', advice: 'Prune as growth starts in late April if weather is warm and dry. / Snoei bij start groei eind april, mits warm en droog.' },
      { month: 5, state: 'optimal', advice: 'Spring pruning: Excellent time. Prune when tree is in growth to avoid canker. / Lentesnoei: Uitstekende tijd om snoeikanker te voorkomen.' },
      { month: 6, state: 'acceptable', advice: 'Light pruning to thin out branches. / Lichte snoei om takken uit te dunnen.' },
      { month: 7, state: 'optimal', advice: 'Summer pruning: Prune after harvest to control shape and encourage spurs. / Zomersnoei: Snoei na de oogst voor vormbehoud.' },
      { month: 8, state: 'optimal', advice: 'Summer pruning: Post-harvest pruning on dry days. / Zomersnoei: Snoei na de oogst op droge dagen.' },
      { month: 9, state: 'avoid', advice: 'Avoid pruning. / Vermijd snoei.' },
      { month: 10, state: 'avoid', advice: 'Do not prune. / Niet snoeien.' },
      { month: 11, state: 'bleeding_risk', advice: 'Avoid winter pruning. / Wintersnoei vermijden.' },
      { month: 12, state: 'bleeding_risk', advice: 'Avoid winter pruning. / Wintersnoei vermijden.' }
    ],
    defaultInstructions: {
      targetShoots: 'Thin out crossing branches and water shoots. Keep short fruiting spurs. / Dun kruisende takken en waterloten uit. Behoud korte vruchtsporen.',
      cutDepth: 'Cut back new shoots by 1/3 to a leaf bud. / Kort jonge scheuten met 1/3 in tot een bladknop.',
      tools: ['Pruning shears / Snoeischaar', 'Loppers / Takkenschaar'],
      frostWarning: true
    }
  },
  {
    id: 'rose-001',
    commonName: 'Rose (Roos)',
    latinName: 'Rosa',
    description: 'A beloved flowering shrub. Needs hard pruning in spring to encourage fresh, flowering shoots. / Geliefde bloeiende struik. Hardsnoeien in het voorjaar stimuleert nieuwe, bloemrijke scheuten.',
    trimmingMatrix: [
      { month: 1, state: 'avoid', advice: 'Do not prune in winter. / Niet snoeien in de winter.' },
      { month: 2, state: 'avoid', advice: 'Do not prune in winter. / Niet snoeien in de winter.' },
      { month: 3, state: 'optimal', advice: 'Main pruning: Cut back hard once the coldest frost is past. Remove dead, weak, or thin wood. / Hoofdsnoei: Snoei flink terug zodra de strengste vorst voorbij is. Verwijder dood en zwak hout.' },
      { month: 4, state: 'acceptable', advice: 'Clean up any remaining dead wood or damaged shoots. / Resterend dood hout of beschadigde scheuten weghalen.' },
      { month: 5, state: 'avoid', advice: 'Do not prune. Buds are forming. / Niet snoeien. Bloemknoppen worden gevormd.' },
      { month: 6, state: 'acceptable', advice: 'Deadheading: Cut back spent flowers to a 5-leaflet leaf to stimulate new blooms. / Uitbloeiers snoeien: Knip uitgebloeide bloemen terug tot boven het eerste vijfdelige blad.' },
      { month: 7, state: 'acceptable', advice: 'Deadheading: Remove spent flowers regularly. / Uitbloeiers snoeien: Verwijder regelmatig uitgebloeide rozen.' },
      { month: 8, state: 'acceptable', advice: 'Deadheading: Continue removing spent flowers. / Uitbloeiers snoeien: Ga door met het verwijderen van uitgebloeide rozen.' },
      { month: 9, state: 'acceptable', advice: 'Light autumn trim: Shorten long shoots to prevent wind-rock in winter. / Lichte herfstbeurt: Kort lange takken in om windschade te voorkomen.' },
      { month: 10, state: 'avoid', advice: 'Do not prune hard. / Niet hard snoeien.' },
      { month: 11, state: 'avoid', advice: 'Do not prune in winter. / Niet snoeien in de winter.' },
      { month: 12, state: 'avoid', advice: 'Do not prune in winter. / Niet snoeien in de winter.' }
    ],
    defaultInstructions: {
      targetShoots: 'Dead, diseased, weak wood, and faded flowers. / Dood, ziek, zwak hout en uitgebloeide bloemen.',
      cutDepth: 'Cut back to 3-5 buds from the base, slanting away from the bud. / Snoei terug tot op 3-5 knoppen vanaf de basis, schuin wegsnijdend van de knop.',
      tools: ['Rose shears / Snoeischaar'],
      frostWarning: true
    }
  },
  {
    id: 'grapevine-001',
    commonName: 'Grapevine (Druif)',
    latinName: 'Vitis vinifera',
    description: 'A vigorous climber. WARNING: Pruning after January causes severe bleeding of sap which can weaken or kill the vine. Prune in Dec/Jan. / Krachtige klimmer. LET OP: Snoeien na januari leidt tot hevig bloeden van de sapstroom, wat de plant verzwakt. Snoei in dec/jan.',
    trimmingMatrix: [
      { month: 1, state: 'optimal', advice: 'Winter pruning: Last chance for main structural pruning before sap rises. Prune spurs back. / Wintersnoei: Laatste kans voor hoofdsnoei voor de sapstroom stijgt. Snoei zijtakken kort.' },
      { month: 2, state: 'bleeding_risk', advice: 'CRITICAL WARNING: High risk of severe bleeding. Do not prune now. / DANGER: Groot risico op hevig doodbloeden. Nu niet snoeien!' },
      { month: 3, state: 'bleeding_risk', advice: 'CRITICAL WARNING: Sap is rising. Never prune now. / DANGER: Sapstroom stijgt. Absoluut niet snoeien!' },
      { month: 4, state: 'bleeding_risk', advice: 'CRITICAL WARNING: Sap is rising. Never prune now. / DANGER: Absoluut niet snoeien!' },
      { month: 5, state: 'avoid', advice: 'Do not prune. / Niet snoeien.' },
      { month: 6, state: 'optimal', advice: 'Summer pruning: Pinch out side shoots (dieven) to direct energy to fruit bunches. / Zomersnoei: Dieven (okselscheuten weghalen) om energie naar de druiventrossen te sturen.' },
      { month: 7, state: 'optimal', advice: 'Summer pruning: Trim back non-fruiting shoots and thin out leaves to expose grapes to sun. / Zomersnoei: Blad weghalen en niet-dragende scheuten inkorten om trossen zon te geven.' },
      { month: 8, state: 'acceptable', advice: 'Summer pruning: Continue pinching out new growth and thinning grapes. / Zomersnoei: Ga door met dieven en dun eventueel kleine druiven uit.' },
      { month: 9, state: 'avoid', advice: 'Do not prune. Fruit is ripening. / Niet snoeien. Druiven rijpen.' },
      { month: 10, state: 'avoid', advice: 'Avoid pruning. Wait for leaf fall. / Vermijd snoeien. Wacht tot het blad valt.' },
      { month: 11, state: 'acceptable', advice: 'Late autumn pruning: Can begin once leaves have fully fallen and plant is dormant. / Herfstsnoei: Kan starten zodra al het blad is gevallen en de plant in rust is.' },
      { month: 12, state: 'optimal', advice: 'Winter pruning: Ideal month. Prune main spurs back to 1-2 buds while fully dormant. / Wintersnoei: Ideale maand. Snoei vruchttakken terug tot op 1-2 knoppen tijdens diepe rust.' }
    ],
    defaultInstructions: {
      targetShoots: 'Side shoots from main structural branches, summer okselscheuten (dieven). / Zijscheuten van de hoofdtakken en zomerscheuten (dieven).',
      cutDepth: 'Prune spurs back to 1-2 buds in winter. / Zijtakken terugknippen tot op 1-2 knoppen (ogen) in de winter.',
      tools: ['Pruning shears / Snoeischaar'],
      frostWarning: false
    }
  }
];
