The genotypedetail page is actually generated as part of the alleledetail page.
The AlleleDetailController checks whether the URL's path says "alleledetail" or "genotypedetail".
It would be nice to split out the genotype detail as a shared component with the allele detail page, but 
I wasn't sure how to achieve this (and it didn't seem worth the effort) in out ancient version of Angular.
