/**
 * Reading Levels 56-100: a ladder from Grade 5 vocabulary to doctoral-level academic language.
 * Each entry is read twice: on its own, then in a sentence. After each, the reader picks its meaning.
 * Entries are [word or phrase, meaning, sentence that uses it].
 */
export type VocabEntry = [string, string, string]

export interface Band {
  name: string
  from: number
  to: number
  entries: VocabEntry[]
}

export const ADVANCED_FROM = 56

export const BANDS: Band[] = [
  {
    name: 'Grade 5–6', from: 56, to: 60,
    entries: [
      ['enormous', 'very large in size', 'The enormous whale swam slowly beside our tiny boat.'],
      ['reluctant', 'not wanting to do something', 'Maya was reluctant to jump into the cold lake.'],
      ['fragile', 'easily broken', 'Wrap the fragile glass vase in a soft towel.'],
      ['ancient', 'very, very old', 'We explored the ruins of an ancient castle.'],
      ['curious', 'wanting to learn or know more', 'The curious puppy sniffed every box in the garage.'],
      ['gradual', 'happening slowly, step by step', 'The gradual change in the leaves told us that fall had come.'],
      ['eager', 'excited and ready to do something', 'The eager students raised their hands before the question ended.'],
      ['observe', 'to watch carefully', 'Scientists observe the birds to learn how they build nests.'],
      ['predict', 'to say what will happen', 'Can you predict how the story will end?'],
      ['conclude', 'to decide after thinking it through', 'After the test, we can conclude that plants need sunlight.'],
      ['cautious', 'careful to avoid danger', 'Be cautious when you cross the busy street.'],
      ['rival', 'a competitor', 'Our team finally beat its biggest rival.'],
      ['vivid', 'bright, clear and full of detail', 'She painted a vivid sunset of orange and pink.'],
      ['timid', 'shy and easily frightened', 'The timid kitten hid under the bed during the storm.'],
      ['generous', 'happy to give or share', 'Our generous neighbor shared tomatoes from her garden.'],
      ['persuade', 'to convince someone', 'Sam tried to persuade his parents to get a puppy.'],
      ['confident', 'sure of yourself', 'After practicing, Leo felt confident about his speech.'],
      ['break the ice', 'start a conversation in an awkward moment', 'Dad told a joke to break the ice at the party.'],
      ['piece of cake', 'something very easy', 'The spelling test was a piece of cake.'],
      ['under the weather', 'feeling sick', 'Grandma stayed home because she felt under the weather.'],
      ['hit the books', 'study hard', 'I need to hit the books before the test on Friday.'],
      ['spill the beans', 'tell a secret', "Please don't spill the beans about the surprise party."],
      ['on cloud nine', 'extremely happy', 'She was on cloud nine after winning the race.'],
      ['cold feet', 'sudden nervousness about doing something', 'He got cold feet right before the talent show.'],
      ['a drop in the bucket', 'a tiny amount compared to what is needed', 'Ten dollars is a drop in the bucket for a new roof.'],
    ],
  },
  {
    name: 'Middle School', from: 61, to: 65,
    entries: [
      ['ambiguous', 'having more than one possible meaning', 'The ending of the movie was ambiguous, so we argued about it.'],
      ['meticulous', 'extremely careful about details', 'The meticulous artist painted every feather on the bird.'],
      ['inevitable', 'certain to happen', 'With dark clouds overhead, rain seemed inevitable.'],
      ['diligent', 'hardworking and steady', 'A diligent student reviews her notes every night.'],
      ['skeptical', 'doubtful; not easily convinced', 'I was skeptical when he said his dog could count.'],
      ['obsolete', 'no longer used; out of date', 'Floppy disks became obsolete when flash drives arrived.'],
      ['resilient', 'able to recover quickly from trouble', 'The resilient town rebuilt quickly after the flood.'],
      ['elaborate', 'detailed and complicated', 'They built an elaborate sandcastle with towers and bridges.'],
      ['hostile', 'unfriendly and aggressive', 'The hostile dog growled at everyone who passed the fence.'],
      ['tedious', 'long, slow and boring', 'Copying the whole dictionary by hand would be tedious.'],
      ['abundant', 'more than enough; plentiful', 'Apples are abundant in the orchard every autumn.'],
      ['contradict', 'to say the opposite of', 'The second witness seemed to contradict the first.'],
      ['emphasize', 'to give special importance to', 'The coach likes to emphasize teamwork over winning.'],
      ['infer', 'to figure out from clues', 'From her muddy boots, we can infer that she walked through the field.'],
      ['mimic', "to copy someone's actions or sounds", 'Parrots can mimic human voices.'],
      ['novice', 'a beginner', 'As a novice skier, I stayed on the easy slopes.'],
      ['candid', 'honest and direct', 'My friend gave me a candid opinion of my drawing.'],
      ['prudent', 'wise and careful about the future', 'It is prudent to save some money for emergencies.'],
      ['bite off more than you can chew', 'take on more than you can handle', 'By joining four clubs at once, Ava bit off more than she could chew.'],
      ['the ball is in your court', 'it is your turn to decide or act', 'I made my offer, so the ball is in your court.'],
      ['burn the midnight oil', 'work late into the night', 'We burned the midnight oil to finish the science project.'],
      ['a blessing in disguise', 'something good that first seemed bad', 'Missing the bus was a blessing in disguise, because I found my lost wallet.'],
      ['cut corners', 'do something cheaply or carelessly', 'The builder cut corners, and the roof soon leaked.'],
      ['see eye to eye', 'agree', 'My brother and I rarely see eye to eye about movies.'],
      ['hold your horses', 'wait; be patient', 'Hold your horses, the pizza is not ready yet.'],
    ],
  },
  {
    name: 'High School', from: 66, to: 70,
    entries: [
      ['benevolent', 'kind and wanting to help others', 'The benevolent king opened the palace gardens to everyone.'],
      ['ephemeral', 'lasting a very short time', 'The beauty of the cherry blossoms is ephemeral.'],
      ['pragmatic', 'practical rather than idealistic', 'She took a pragmatic approach and fixed the cheapest problem first.'],
      ['cynical', 'believing people act only for selfish reasons', 'Years of broken promises made the voters cynical.'],
      ['eloquent', 'speaking clearly and persuasively', 'Her eloquent speech moved the entire audience.'],
      ['frugal', 'careful not to waste money', 'My frugal uncle reuses every paper bag.'],
      ['scrutinize', 'to examine very closely', 'The judges scrutinize each painting before choosing a winner.'],
      ['ambivalent', 'having mixed feelings', 'I felt ambivalent about moving: excited, but sad to leave my friends.'],
      ['lethargic', 'sluggish and lacking energy', 'The heat made everyone lethargic by the afternoon.'],
      ['tenacious', 'refusing to give up', 'The tenacious climber reached the summit on her third try.'],
      ['arbitrary', 'based on random choice, not reason', 'The rule seemed arbitrary because no one could explain it.'],
      ['catalyst', 'something that causes change', 'The new library was a catalyst for growth downtown.'],
      ['mundane', 'ordinary and dull', 'He wanted adventure, not another mundane afternoon of chores.'],
      ['alleviate', 'to make something less painful or severe', 'The medicine helped alleviate her headache.'],
      ['coherent', 'logical and clearly connected', 'Your essay needs a coherent argument from start to finish.'],
      ['discrepancy', 'a difference that should not be there', 'The bank found a discrepancy between the two receipts.'],
      ['juxtapose', 'to place side by side for contrast', 'The photographer likes to juxtapose old buildings with new ones.'],
      ['volatile', 'likely to change suddenly', 'The volatile weather switched from sunshine to hail in minutes.'],
      ["devil's advocate", 'someone who argues the other side to test an idea', "I'll play devil's advocate and defend the opposite view."],
      ['the elephant in the room', 'an obvious problem no one mentions', 'The low test scores were the elephant in the room at the meeting.'],
      ['a double-edged sword', 'something with both good and bad effects', 'Fame can be a double-edged sword for a young singer.'],
      ['jump on the bandwagon', 'join something because it is popular', 'Many fans jumped on the bandwagon when the team started winning.'],
      ['beat around the bush', 'avoid saying something directly', 'Stop beating around the bush and tell me what happened.'],
      ['the tip of the iceberg', 'a small visible part of a much bigger problem', 'The broken window was only the tip of the iceberg.'],
      ['a moot point', 'an issue that no longer matters', 'Whether to bring umbrellas is a moot point, since the trip was canceled.'],
    ],
  },
  {
    name: 'College Prep', from: 71, to: 75,
    entries: [
      ['ubiquitous', 'found everywhere', 'Smartphones have become ubiquitous in modern life.'],
      ['capricious', 'changing mood or behavior without warning', 'The capricious ruler changed the laws on a whim.'],
      ['esoteric', 'understood by only a small group', 'The lecture was full of esoteric references to ancient poetry.'],
      ['magnanimous', 'generous and forgiving, especially toward a rival', "The magnanimous winner praised her opponent's effort."],
      ['obfuscate', 'to make deliberately unclear', 'The company tried to obfuscate its losses with confusing charts.'],
      ['pernicious', 'harmful in a gradual or hidden way', 'Misinformation has a pernicious effect on public trust.'],
      ['recalcitrant', 'stubbornly uncooperative', 'The recalcitrant mule refused to cross the bridge.'],
      ['sycophant', 'a person who flatters others to gain favor', 'The king surrounded himself with sycophants who never disagreed.'],
      ['venerable', 'respected because of age or wisdom', 'The venerable professor had taught for fifty years.'],
      ['laconic', 'using very few words', 'His laconic reply was simply, "No."'],
      ['paradigm', 'a model or typical pattern of thinking', 'The discovery forced a paradigm shift in biology.'],
      ['anachronism', 'something placed in the wrong time period', 'A wristwatch in a movie about ancient Rome is an anachronism.'],
      ['acquiesce', 'to accept or agree without protest', 'After a long debate, the board finally acquiesced to the plan.'],
      ['didactic', 'intended to teach a lesson', "The fable's didactic tone made its moral obvious."],
      ['fastidious', 'very attentive to cleanliness and detail', 'The fastidious chef wiped the rim of every plate before serving.'],
      ['garrulous', 'very talkative', 'The garrulous passenger chatted for the entire flight.'],
      ['hubris', 'excessive pride or self-confidence', 'His hubris led him to ignore every warning.'],
      ['nefarious', 'wicked or criminal', "The villain's nefarious plan was finally exposed."],
      ['quixotic', 'idealistic but unrealistic', 'Building an ice castle in July was a quixotic dream.'],
      ['a Pyrrhic victory', 'a win that costs so much it is hardly worth it', 'The lawsuit was a Pyrrhic victory that bankrupted the company.'],
      ["Achilles' heel", 'a weak point', "Spelling has always been my Achilles' heel."],
      ['cross the Rubicon', 'make a decision that cannot be undone', 'By quitting her job to start a company, she crossed the Rubicon.'],
      ['a Catch-22', 'a no-win situation created by contradictory rules', 'You need experience to get a job but a job to get experience: a Catch-22.'],
      ["Pandora's box", 'a source of many unexpected troubles', "Changing the rules opened a Pandora's box of complaints."],
      ['the Midas touch', 'the ability to make everything succeed', 'Every company she starts thrives; she has the Midas touch.'],
    ],
  },
  {
    name: 'College', from: 76, to: 80,
    entries: [
      ['empirical', 'based on observation or experiment', 'The theory was popular, but it lacked empirical evidence.'],
      ['hypothesis', 'a testable proposed explanation', 'Her hypothesis predicted that warmer water holds less oxygen.'],
      ['correlation', 'a relationship in which two things vary together', 'A correlation between ice cream sales and sunburns does not prove that one causes the other.'],
      ['synthesis', 'the combining of parts into a whole', 'The essay offered a synthesis of three competing theories.'],
      ['dichotomy', 'a division into two opposed parts', 'The novel explores the dichotomy between duty and desire.'],
      ['rhetoric', 'the art of persuasive speaking or writing', "The candidate's rhetoric inspired the crowd but offered few details."],
      ['nuance', 'a subtle difference in meaning', 'A good translator captures every nuance of the original poem.'],
      ['pedagogy', 'the method and practice of teaching', 'Modern pedagogy encourages students to ask their own questions.'],
      ['autonomy', 'self-government; independence', 'The region won greater autonomy from the central government.'],
      ['infrastructure', 'basic public systems such as roads, water and power', "The hurricane damaged the city's infrastructure."],
      ['mitigate', 'to make less harmful', 'Planting trees can mitigate the effects of urban heat.'],
      ['ostensibly', 'apparently, though perhaps not really', 'The meeting was ostensibly about budgets, but it was really about layoffs.'],
      ['prolific', 'producing a great amount of work', 'The prolific author published three novels a year.'],
      ['quantitative', 'measured in numbers', 'The study gathered quantitative data from five thousand surveys.'],
      ['qualitative', 'describing qualities rather than numbers', 'Interviews provided qualitative insight into how patients felt.'],
      ['substantiate', 'to support with evidence', 'The reporter could not substantiate the rumor.'],
      ['ethnocentrism', "judging other cultures by one's own standards", "The explorer's journals reveal a striking ethnocentrism."],
      ['cognition', 'the mental processes of knowing and thinking', 'Sleep plays a key role in memory and cognition.'],
      ['socioeconomic', 'relating to social class and income together', 'Socioeconomic status can affect access to health care.'],
      ['bias', 'an unfair preference for or against something', "The survey's wording introduced bias into the results."],
      ['variable', 'a factor that can change in an experiment', 'Water temperature was the only variable we changed.'],
      ['peer review', 'evaluation of work by experts in the same field', 'The study passed peer review before it was published.'],
      ['anecdotal', 'based on personal stories rather than research', 'His evidence was anecdotal, drawn from a few conversations with friends.'],
      ['abstract', 'a short summary at the start of a research paper', 'Read the abstract before deciding whether to read the full paper.'],
      ['methodology', 'the system of methods used in research', 'Critics questioned the methodology of the survey.'],
    ],
  },
  {
    name: 'Advanced College', from: 81, to: 85,
    entries: [
      ['epistemology', 'the study of knowledge and how we know things', 'Epistemology asks how we can be certain of anything at all.'],
      ['ontology', 'the study of the nature of being and existence', 'Ontology examines what kinds of things exist.'],
      ['hegemony', 'dominance of one group over others', "The empire's cultural hegemony shaped art across the continent."],
      ['heuristic', 'a mental shortcut for solving problems', 'Using a simple heuristic, she estimated the answer in seconds.'],
      ['teleological', 'explaining things by their purpose or goal', 'A teleological argument claims that nature is designed for a purpose.'],
      ['dialectic', 'reasoning through opposing ideas to reach the truth', "Through dialectic, the students tested each other's claims."],
      ['paradox', 'a statement that seems to contradict itself yet may be true', '"Less is more" is a familiar paradox.'],
      ['axiom', 'a statement accepted as true without proof', 'Euclidean geometry begins with a handful of simple axioms.'],
      ['tautology', 'saying the same thing twice in different words', 'The phrase "free gift" is a tautology, since gifts are always free.'],
      ['entropy', 'a measure of disorder in a system', 'Over time, entropy in a closed system tends to increase.'],
      ['homeostasis', "the body's balance of stable internal conditions", 'Sweating helps maintain homeostasis by cooling the body.'],
      ['symbiosis', 'a close relationship that benefits two species', 'Clownfish and sea anemones live in symbiosis.'],
      ['zeitgeist', 'the spirit or mood of a particular era', 'The song captured the zeitgeist of the 1960s.'],
      ['vernacular', 'the everyday language of ordinary people', 'The poet wrote in the vernacular rather than in formal Latin.'],
      ['existential', 'relating to existence and its meaning', 'The novel raises existential questions about freedom and choice.'],
      ['utilitarian', 'aiming at the greatest good for the greatest number', 'A utilitarian policy weighs total benefits against total harms.'],
      ['empiricism', 'the view that knowledge comes from experience', 'Empiricism holds that the senses are the source of knowledge.'],
      ['determinism', 'the belief that every event is caused by earlier events', 'Determinism challenges the idea of free will.'],
      ['semiotics', 'the study of signs and symbols', 'Semiotics explains why a red light means stop.'],
      ['cognitive dissonance', 'discomfort from holding conflicting beliefs', 'Smokers who know the health risks may feel cognitive dissonance.'],
      ['confirmation bias', 'favoring information that supports what you already believe', 'Confirmation bias led him to read only articles that agreed with him.'],
      ['opportunity cost', 'the value of the next-best option you give up', 'The opportunity cost of studying tonight is missing the concert.'],
      ['externality', 'a side effect felt by people outside a transaction', 'Air pollution is a negative externality of many factories.'],
      ['jurisprudence', 'the theory and philosophy of law', 'Her book traces the history of American jurisprudence.'],
      ['catharsis', 'emotional release, often through art', 'Watching the tragedy gave the audience a sense of catharsis.'],
    ],
  },
  {
    name: 'Graduate', from: 86, to: 90,
    entries: [
      ['hermeneutics', 'the theory of interpretation, especially of texts', 'Hermeneutics guides scholars in interpreting ancient scriptures.'],
      ['phenomenology', 'the study of conscious experience from the inside', 'Phenomenology describes how the world appears to consciousness.'],
      ['reification', 'treating an abstract idea as if it were a concrete thing', 'Saying that "the market is angry" is a reification of millions of individual choices.'],
      ['epiphenomenon', 'a by-product that has no effects of its own', 'Some philosophers argue that consciousness is merely an epiphenomenon of brain activity.'],
      ['counterfactual', 'about what would have happened under different conditions', 'A counterfactual analysis asks what would have happened without the vaccine.'],
      ['endogenous', 'originating from within a system', 'The model treats interest rates as endogenous rather than imposed from outside.'],
      ['exogenous', 'originating from outside a system', 'An exogenous shock, such as a sudden war, disrupted the regional economy.'],
      ['orthogonal', 'independent of or unrelated to', 'In this study, height was orthogonal to test performance.'],
      ['parsimony', 'preferring the simplest adequate explanation', 'The principle of parsimony favors the theory with fewer assumptions.'],
      ['falsifiability', 'the possibility that a claim could be proven false by evidence', 'Popper argued that falsifiability separates science from pseudoscience.'],
      ['operationalize', 'to define a concept so that it can be measured', 'The researchers had to operationalize happiness as a score on a survey.'],
      ['confound', 'a hidden factor that distorts a result', 'Age was a confound in the study of coffee and memory.'],
      ['heteroskedasticity', 'unequal spread of errors across the range of data', 'The residual plot revealed heteroskedasticity in the regression model.'],
      ['stochastic', 'involving randomness or probability', 'Stock prices are often modeled as a stochastic process.'],
      ['asymptotic', 'approaching a limit ever more closely', 'The curve shows asymptotic growth toward one hundred percent.'],
      ['idiosyncratic', 'peculiar to one individual', 'His idiosyncratic writing style made his papers easy to recognize.'],
      ['polemic', 'a strong written or spoken attack on an idea', 'The pamphlet was a fierce polemic against the new tax.'],
      ['historiography', 'the study of how history is written', 'Historiography reveals how each generation retells the past.'],
      ['postcolonial', 'concerning the lasting effects of colonial rule', 'Postcolonial literature often questions inherited national borders.'],
      ['agency', "a person's capacity to act independently", 'The novel gives its heroine real agency over her own fate.'],
      ['praxis', 'the practical application of a theory', 'The seminar moved from theory to praxis through community projects.'],
      ['apologia', "a formal written defense of one's beliefs or conduct", 'The memoir reads as an apologia for his political career.'],
      ['canonical', 'accepted as standard or authoritative', "Shakespeare's plays are canonical works of English literature."],
      ['liminal', 'relating to an in-between, transitional state', 'Adolescence is a liminal stage between childhood and adulthood.'],
      ['intersubjectivity', 'shared understanding between different minds', 'Language depends on intersubjectivity among its speakers.'],
    ],
  },
  {
    name: 'Graduate+', from: 91, to: 95,
    entries: [
      ['epistemic', 'relating to knowledge or its justification', "The witness's epistemic position was weak because she saw only shadows."],
      ['ontological', 'relating to the nature of existence', 'The debate concerns the ontological status of numbers and whether they exist independently of minds.'],
      ['instantiate', 'to represent as a concrete example', 'Each experiment must instantiate the theory under carefully controlled conditions.'],
      ['supervenience', 'a relation in which one set of properties depends on another', 'Supervenience holds that mental states cannot change without some underlying physical change.'],
      ['incommensurable', 'lacking any common standard for comparison', 'Kuhn argued that rival scientific paradigms may be incommensurable.'],
      ['underdetermination', 'when the evidence cannot decide between competing theories', 'The underdetermination of theory by data means that several explanations may fit the same results.'],
      ['emergent', 'arising from interactions but absent in the parts alone', 'Wetness is an emergent property of countless water molecules acting together.'],
      ['reflexivity', "a researcher's examination of their own influence on the research", 'Ethnographers practice reflexivity by examining how their presence shapes the community they study.'],
      ['deontological', 'judging actions by duties and rules rather than results', 'A deontological ethicist might refuse to lie even to prevent a greater harm.'],
      ['normative', 'concerned with how things ought to be', 'Economics includes normative claims about which policies are fair.'],
      ['positivist', 'holding that only observable, testable facts count as knowledge', 'The positivist tradition dismissed metaphysics as meaningless speculation.'],
      ['a priori', 'known independently of experience', 'Mathematical truths are often said to be known a priori.'],
      ['a posteriori', 'known through experience', 'That water boils at one hundred degrees at sea level is known a posteriori.'],
      ['ceteris paribus', 'with all other things held equal', 'Ceteris paribus, a higher price will reduce the quantity demanded.'],
      ['multicollinearity', 'strong correlation among the predictors in a model', 'Multicollinearity inflated the standard errors of the regression coefficients.'],
      ['endogeneity', 'when an explanatory variable is tangled up with the error term', 'Instrumental variables are one way to address endogeneity in observational studies.'],
      ['aporia', 'an unresolvable puzzle or impasse in an argument', 'The dialogue ends in aporia, with no definition of justice agreed upon.'],
      ['synecdoche', 'a figure of speech in which a part stands for the whole', 'Calling farm workers "hands" is an example of synecdoche.'],
      ['metonymy', 'naming something by a closely associated thing', 'Saying "the Crown" for the monarchy is an example of metonymy.'],
      ['solipsism', "the view that only one's own mind is sure to exist", 'Solipsism is difficult to refute but even harder to live by.'],
      ['nominalism', 'the view that general terms are only names, not real entities', 'Nominalism denies that "redness" exists apart from individual red things.'],
      ['qualia', 'the subjective qualities of conscious experience', 'Qualia, such as the redness of red, seem to resist purely physical explanation.'],
      ['intertextuality', "the shaping of a text's meaning by other texts", "The novel's intertextuality rewards readers who know Homer."],
      ['path dependence', 'when earlier choices limit later options', 'The awkward keyboard layout survives largely through path dependence.'],
      ['methodological individualism', 'explaining social events through individual actions', 'Methodological individualism explains market prices through the choices of individual buyers and sellers.'],
    ],
  },
  {
    name: 'Doctorate', from: 96, to: 100,
    entries: [
      ['Bayesian inference', 'updating probabilities as new evidence arrives', 'Bayesian inference allows researchers to revise their prior beliefs in light of new data.'],
      ['p-hacking', 'reworking analyses until the results look significant', 'P-hacking undermines the credibility of findings that barely cross the significance threshold.'],
      ['statistical power', 'the chance that a study detects an effect that is really there', 'Small samples often lack the statistical power needed to detect modest effects.'],
      ['construct validity', 'how well a test measures the concept it claims to measure', 'Critics questioned the construct validity of measuring intelligence with a single test.'],
      ['external validity', 'how well results apply beyond the original study', 'Laboratory findings may lack external validity when applied to real classrooms.'],
      ['heterogeneity', 'variation or diversity within a group', 'Substantial heterogeneity across the included studies complicated the analysis.'],
      ['meta-analysis', 'a combined statistical analysis of many studies', 'The meta-analysis pooled results from forty randomized controlled trials.'],
      ['longitudinal', 'following the same subjects over a long period', 'A longitudinal study tracked the same children for twenty years.'],
      ['paradigmatic', 'serving as the typical example or model', 'The case became paradigmatic for later studies of urban migration.'],
      ['reductionism', 'explaining complex things entirely by their simplest parts', 'Strict reductionism struggles to explain consciousness in terms of neurons alone.'],
      ['poststructuralism', 'the theory that meaning is unstable and shaped by language and power', 'Poststructuralism questions whether any text has a single, stable meaning.'],
      ['dialectical materialism', 'the Marxist theory that material conflicts drive history', 'Dialectical materialism interprets history as a sequence of economic conflicts.'],
      ['the hard problem of consciousness', 'why physical processes produce subjective experience at all', 'The hard problem of consciousness asks why brain activity is accompanied by experience at all.'],
      ["Gödel's incompleteness", 'the proof that consistent formal systems contain unprovable truths', "Gödel's incompleteness theorems showed that no consistent system of arithmetic can prove every truth about numbers."],
      ['the is-ought problem', 'the gap between factual claims and moral claims', 'The is-ought problem warns that moral conclusions cannot follow from facts alone.'],
      ['latent variable', 'a hidden quantity inferred from observed data', 'Intelligence is often treated as a latent variable inferred from many different test scores.'],
      ['causal inference', 'drawing conclusions about cause and effect', 'Randomized trials remain the gold standard for causal inference.'],
      ['regression discontinuity', 'comparing cases just above and just below a cutoff', 'A regression discontinuity design compared students just above and just below the scholarship cutoff.'],
      ['selection bias', 'distortion caused by a sample that is not random', 'Surveying only gym members introduced selection bias into the fitness study.'],
      ['null hypothesis', 'the default claim that there is no effect', 'Because the effect was small and noisy, the researchers failed to reject the null hypothesis.'],
      ['ecological fallacy', 'wrongly inferring individual traits from group data', 'Assuming that every resident of a wealthy county is rich commits the ecological fallacy.'],
      ['the Hawthorne effect', 'people behaving differently because they are being observed', 'Productivity rose during the study, possibly because of the Hawthorne effect.'],
      ['the tragedy of the commons', 'shared resources being overused by people acting in self-interest', 'Overfishing in international waters illustrates the tragedy of the commons.'],
      ['the principal-agent problem', 'conflict when someone acting for another has different interests', 'Executive bonuses tied to short-term stock prices can worsen the principal-agent problem.'],
      ['epistemic humility', "recognizing the limits of one's own knowledge", 'Epistemic humility requires scientists to state clearly how uncertain their conclusions are.'],
    ],
  },
]

/** The ten items for each advanced level: in each band, the words and phrases first, then the sentences. */
export function advancedLevels(): Record<number, string[]> {
  const out: Record<number, string[]> = {}
  for (const band of BANDS) {
    const items = [...band.entries.map((e) => e[0]), ...band.entries.map((e) => e[2])]
    for (let level = band.from; level <= band.to; level++) {
      const i = (level - band.from) * 10
      out[level] = items.slice(i, i + 10)
    }
  }
  return out
}

/** Looks up a word, phrase or sentence from the advanced levels. */
const INDEX = new Map<string, { entry: VocabEntry; band: Band; isSentence: boolean }>()
for (const band of BANDS) {
  for (const entry of band.entries) {
    INDEX.set(entry[0].toLowerCase(), { entry, band, isSentence: false })
    INDEX.set(entry[2].toLowerCase(), { entry, band, isSentence: true })
  }
}

export function lookupAdvanced(text: string) {
  return INDEX.get(text.trim().toLowerCase())
}

export function bandFor(level: number): Band | undefined {
  return BANDS.find((b) => level >= b.from && level <= b.to)
}
