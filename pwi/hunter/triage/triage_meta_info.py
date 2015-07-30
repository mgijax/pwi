"""
TODO(ktone): This needs to be refactored to use database tables

This is just to get something up and working for testing
"""

from pwi import app


# map of primary curator for each journal
# TODO(kstone): this needs to be in the database
PRIMARY_CURATOR_LIST = """
Journal\tCurator\tLogin
Eur J Neurosci\tCindy Smith\tcsmith
PLoS One\tCindy Smith\tcsmith
Anat Rec (Hoboken)\tConnie Smith\tcms
Biol Open\tConnie Smith\tcms
Cereb Cortex\t Connie Smith\tcms
Dev Dyn\tConnie Smith\tcms
Dis Model Mech\tConnie Smith\tcms
Gene Expr Patterns\tConnie Smith\tcms
Genes Dev\tConnie Smith\tcms
Glia\tConnie Smith\tcms
Hum Mol Genet\tConnie Smith\tcms
Int J Dev Biol\tConnie Smith\tcms
Neural Dev\tConnie Smith\tcms
Science\tConnie Smith\tcms
Cell\tDale Begley\tdab
EMBO Rep\tDale Begley\tdab
Int J Cancer\tDale Begley\tdab
J Leukoc Biol\tDale Begley\tdab
J Virol\tDale Begley\tdab
Nat Rev Cancer\tDale Begley\tdab
Oncogene\tDale Begley\tdab
Semin Cancer Biol\tDale Begley\tdab
Toxicol Appl Pharmacol\tDale Begley\tdab
Biochem Pharmacol\tDavid Hill\tdph
Bone\tDavid Hill\tdph
Brain Res\tDavid Hill\tdph
Exp Cell Res\tDavid Hill\tdph
Exp Neurol\tDavid Hill\tdph
FASEB J\tDavid Hill\tdph
Neurobiol Dis\tDavid Hill\tdph
Neuron\tDavid Hill\tdph
Neurosci Lett\tDavid Hill\tdph
Cancer Cell\tDebbie Krupke\tdmk
Cancer Discov\tDebbie Krupke\tdmk
Cancer Lett\tDebbie Krupke\tdmk
Cancer Res\tDebbie Krupke\tdmk
Carcinogenesis\tDebbie Krupke\tdmk
J Natl Cancer Inst\tDebbie Krupke\tdmk
Leukemia\tDebbie Krupke\tdmk
Mol Cancer Res\tDebbie Krupke\tdmk
Cell Immunol\tDmitry Sitnikov\tdmitrys
Eur J Immunol\tDmitry Sitnikov\tdmitrys
Immunity\tDmitry Sitnikov\tdmitrys
Infect Immun\tDmitry Sitnikov\tdmitrys
Int Immunol\tDmitry Sitnikov\tdmitrys
J Cell Sci\tDmitry Sitnikov\tdmitrys
Mol Biol Cell\tDmitry Sitnikov\tdmitrys
Mol Endocrinol\tDmitry Sitnikov\tdmitrys
Mol Immunol\tDmitry Sitnikov\tdmitrys
Nat Immunol\tDmitry Sitnikov\tdmitrys
Nucleic Acids Res\tDmitry Sitnikov\tdmitrys
J Biol Chem\tHarold Drabkin\thjd
Dev Biol\tJackie Finger\tjfinger
Gene\tJackie Finger\tjfinger
J Comp Neurol\tJackie Finger\tjfinger
J Lipid Res\tJackie Finger\tjfinger
J Neurochem\tJackie Finger\tjfinger
J Neurosci\tJackie Finger\tjfinger
Aging Cell\tJingxia Xu\tjx
Am J Physiol Heart Circ Physiol\tJingxia Xu\tjx
Blood\tJingxia Xu\tjx
BMC genomics\tJingxia Xu\tjx
Diabetologia\tJingxia Xu\tjx
Endocrinology\tJingxia Xu\tjx
J Exp Med\tJingxia Xu\tjx
Reproduction\tJingxia Xu\tjx
Am J Physiol Endocrinol Metab\tKaren Christie\tkrc
Biochem J\tKaren Christie\tkrc
Cell Metab\tKaren Christie\tkrc
Cilia\tKaren Christie\tkrc
FEBS J\t Karen Christie\tkrc
Mol Cell\tKaren Christie\tkrc
Mol Cell Endocrinol\tKaren Christie\tkrc
Biochim Biophys Acta\tLi Ni\tln
Nat Commun\t Li Ni\tln
Am J Physiol Cell Physiol\t Meiyee Law\tmlaw
Am J Physiol Gastrointest Liver Physiol\tMeiyee Law\tmlaw
Am J Physiol Lung Cell Mol Physiol\tMeiyee Law\tmlaw
Am J Respir Cell Mol Biol\t Meiyee Law\tmlaw
Biochem Biophys Res Commun\tMeiyee Law\tmlaw
Cell Reports\tMeiyee Law\tmlaw
Cell Stem Cell\tMeiyee Law\tmlaw
Nat Med\tMeiyee Law\tmlaw
PLoS Genet\tMeiyee Law\tmlaw
Stem Cells (Dayton, OH)\tMeiyee Law\tmlaw
Am J Pathol\tMichelle Knowlton\tmnk
Elife\tMichelle Knowlton\tmnk
EMBO J\t Michelle Knowlton\tmnk
FEBS Lett\tMichelle Knowlton\tmnk
J Invest Dermatol\tMichelle Knowlton\tmnk
J Pathol\tMichelle Knowlton\tmnk
J Physiol\tMichelle Knowlton\tmnk
Lab Invest\t Michelle Knowlton\tmnk
Mol Genet Metab\tMichelle Knowlton\tmnk
Mol Vis\tMichelle Knowlton\tmnk
Proc Natl Acad Sci U S A\tMichelle Knowlton\tmnk
Am J Physiol Regul Integr Comp Physiol\tMonica McAndrews\tmmh
Arterioscler Thromb Vasc Biol\t Monica McAndrews\tmmh
Behav Brain Res\tMonica McAndrews\tmmh
Genetics\tMonica McAndrews\tmmh
J Cell Biol\tMonica McAndrews\tmmh
Mamm Genome\tMonica McAndrews\tmmh
Nat Cell Biol\tMonica McAndrews\tmmh
Physiol Genomics\tMonica McAndrews\tmmh
Biol Reprod\tMonika Tomczuk\tmonikat
Circulation\tMonika Tomczuk\tmonikat
Curr Biol\tMonika Tomczuk\tmonikat
J Clin Invest\tMonika Tomczuk\tmonikat
Matrix Biol\tMonika Tomczuk\tmonikat
Mol Cell Endocrinol\tMonika Tomczuk\tmonikat
Nat Neurosci\tMonika Tomczuk\tmonikat
Neurobiol Aging\tMonika Tomczuk\tmonikat
Neuroscience\tMonika Tomczuk\tmonikat
PLoS Biol\tMonika Tomczuk\tmonikat
Am J Hum Genet\tHiroaki Onda\thonda
Arch Biochem Biophys\tHiroaki Onda\thonda
Cardiovasc Res\tHiroaki Onda\thonda
Cell Death Differ\tHiroaki Onda\thonda
Diabetes\tHiroaki Onda\thonda
Exp Eye Res\tHiroaki Onda\thonda
Exp Hematol\tHiroaki Onda\thonda
Genes Cells\tHiroaki Onda\thonda
Invest Ophthalmol Vis Sci\tHiroaki Onda\thonda
Mol Cell Neurosci\tHiroaki Onda\thonda
Nat Genet\tHiroaki Onda\thonda
Circ Res\t Sue Bello\tsmb
Genes Brain Behav\t Sue Bello\tsmb
J Immunol\tSue Bello\tsmb
J Mol Cell Cardiol\tSue Bello\tsmb
Mol Cell Biol\tSue Bello\tsmb
Nature\tSue Bello\tsmb
Neuropharmacology\tSue Bello\tsmb
PLoS Pathog\tSue Bello\tsmb
Sci REp\tSue Bello\tsmb
Sci Transl Med\tSue Bello\tsmb
Toxicol Sci\tSue Bello\tsmb
Transgenic Res\tSue Bello\tsmb
BMC Dev Biol\tTerry Hayamizu\tterryh
Dev Cell\tTerry Hayamizu\tterryh
Development\tTerry Hayamizu\tterryh
Genesis\tTerry Hayamizu\tterryh
Mech Dev\tTerry Hayamizu\tterryh
Neurosci Res\tTerry Hayamizu\tterryh
"""
PRIMARY_CURATOR_MAP = {}
PRIMARY_CURATOR_TO_JOURNAL_MAP = {}
for line in PRIMARY_CURATOR_LIST.strip().split('\n')[1:]:
    line = line.strip()
    if line:
        cols = line.split("\t")
        if len(cols) > 2:
            journal = cols[0].lower().strip()
            fullName = cols[1].strip()
            login = cols[2].lower().strip()
            PRIMARY_CURATOR_MAP[journal] = {"login":login,"name":fullName}
            PRIMARY_CURATOR_TO_JOURNAL_MAP.setdefault(login, []).append(journal)
            

# TODO(kstone): needs to be in a database table
# mapping of journals to their access URLs for curators
JOURNAL_URLS = {
    "cell": "http://www.sciencedirect.com.ezproxy.jax.org/science/journal/00928674",
    "eur j neurosci": "http://eds.b.ebscohost.com.ezproxy.jax.org/ehost/command/detail?sid=a6687b43-90d7-4a89-8dfb-b7ad1538a59b%40sessionmgr111&crlhashurl=Login.aspx%3fdirect%3dtrue%26authtype%3dcookie%2cip%2curl%2cuid%26db%3da9h%26jid%3d80N%26scope%3d",
    "plos one": "http://www.plosone.org/",
}