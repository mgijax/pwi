/*
 * FileWriterService
 *
 * Writes a text file to local disk (user's dowloads folder).
 * This implementation is limited by max blob size and by RAM.
 *
 */
(function() {
	'use strict';
	angular.module('pwi.mgi')
		.factory('FileWriter', FileWriterService);

	function FileWriterService () {
            // Generates a file name consisting of a specified root name, a timestamp, and
            // a .txt extension.
            // E.g. genFileName ("foo") -> "foo.2023_1_8.7_13_10"
            function genFileName (root) {
                const now = new Date()
                return `${root}.${now.getFullYear()}_${now.getMonth()+1}_${now.getDate()}.${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}.txt`
            }
            // Writes a file in user's downloads area.
            // Text can be anything, not just tab-delimited
            function writeFile (filename, text) {
                var element = document.createElement('a');
                var etext = encodeURIComponent(text)
                element.setAttribute('href', 'data:text/plain;charset=utf-8,' + etext)
                element.setAttribute('download', filename);
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
            }
            // Formats a list of object into a TSV file. data is the list of object.
            // Columns is a list of column specifications. Each column spec
            // is a list of 2 items: the column header label, and the attribute name
            // of the data object field for that column.
            // Example:
            //     const data = [{a:99, b:'hello'}, {a:0, b:'goodbye'}]
            //     const columns = [["First Col", 'b'],['Column 2', 'a']]
            //     formatTsv(data, columns) -> 'First Col\tColumn 2\nhello\t99\ngoodbye\t0\n'
            function formatTsv (data, columns) {
                const hdr = columns.map(c => c[0]).join('\t') + '\n'
                const colData = data.map(d => {
                    return columns.map(c => d[c[1]]).join('\t') + '\n'
                })
                return hdr + colData.join('')
            }
            // Convenience function for writing a list of objects to a tab-delimited file.
            function writeDataToTsvFile (fileNameRoot, data, cols) {
                const fname = genFileName(fileNameRoot)
                const text = formatTsv(data, cols)
                writeFile(fname,text)
            }
            //
            return {
                genFileName,
                formatTsv,
                writeFile,
                writeDataToTsvFile
            }
	}


})();
