"""
Module for creating a display of an imagepane
"""
import math

PIXELDB_URL = "http://prodwww.informatics.jax.org/pix/fetch_pixels.cgi?id="

def asHtml(imagePane, maxWidth=None, maxHeight=None):
	"""
	Returns HTML to display the supplied image pane
	(from ImagePane model object)
	respects maxWidth and/or maxHeight if supplied
	"""
	return _asHtml(imagePane.width,
				imagePane.height,
				imagePane.x,
				imagePane.y,
				imagePane.image.xdim,
				imagePane.image.ydim,
				imagePane.image.pixnum,
				maxWidth,
				maxHeight)

def _asHtml(paneWidth, 
		paneHeight,
		paneX, 
		paneY, 
		imageWidth,
		imageHeight, 
		pixeldbID,
		maxWidth, 
		maxHeight):
	"""
	Renders image pane information from
	original image pixeldbID as appropriate
	HTML
	"""
	# need to account for null pane values
	# if height or width is null(or less than 1), 
	# we need to set them to the height/width of the image object as a failsafe
	if paneHeight <= 1 or paneHeight <= 1:
		paneWidth = imageWidth;
		paneHeight = imageHeight;
		
	# default to a scale/ratio of 1
	widthScaleFactor = 1.0
	heightScaleFactor = 1.0
	if maxWidth and paneWidth > maxWidth:
		# calculate the scale (or ratio) that we need to 
		# adjust the pane width to match the desired width
		widthScaleFactor = maxWidth / float(paneWidth)
		
	if maxHeight and paneHeight > maxHeight:
		# calculate the scale (or ratio) that we need to 
		# adjust the pane Height to match the desired Height
		heightScaleFactor = maxHeight / float(paneHeight)
		
	scaleFactor = min(widthScaleFactor, heightScaleFactor)
	
	# calculate all the six relative values for displaying an image pane.
	# NOTE: if scale is 1 (the default) then the values are equal to their database coordinates
	paneX = _scale(paneX,scaleFactor);
	paneY = _scale(paneY,scaleFactor);
	paneWidth = _scale(paneWidth, scaleFactor);
	paneHeight = _scale(paneHeight, scaleFactor);
	imageWidth = _scale(imageWidth, scaleFactor);
	imageHeight = _scale(imageHeight, scaleFactor);

	
	# calculate the styles for the outer div and the image tags
	# the div just needs to be sized to the window of the pane we are viewing
	divStyles = ['position:relative; display: inline-flex; ',
				'width:%spx;' % paneWidth,
				'height:%spx;' % paneHeight
				]
	
	# the img tag needs to be positioned to the offset where the pane is
	# also the clip must be defined as rect(top,right,bottom,left);
	imgStyles = ['position:absolute;',
				'left:-%spx;' % paneX,
				'top:-%spx;' % paneY,
				'clip: rect(%spx %spx %spx %spx);' % \
						(paneY, (paneWidth + paneX), \
						(paneHeight + paneY), paneX)
				]

	# build the image tag
	imgSrc = PIXELDB_URL + str(pixeldbID);
	
	# we set the explicit width and height of the image to deal with scaling
	imgTag = '<img width="%s" height="%s" style="%s" src="%s" />' % \
			(imageWidth, imageHeight, \
				''.join(imgStyles), imgSrc)
	
	# build the wrapper div tag
	htmlOutput = '<div style="%s">%s</div>' % (''.join(divStyles), imgTag)
	return htmlOutput


def _scale(value, scaleFactor):
	"""
	returns the scaled integer
	"""
	dim = value and int(value) or 0
	return int(math.floor(dim * scaleFactor))
