from wtforms.form import Form
from wtforms.fields import *
from wtforms.widgets import *
from pwi import app

class AutoCompleteWidget(TextInput):
	def __call__(self,field,**kwargs):
                kwargs.setdefault('id', field.id)
                kwargs.setdefault('type', 'text')
                kwargs.setdefault('class', 'ac-input')
                if 'value' not in kwargs:
                        kwargs['value'] = field._value()
                inputField = HTMLString('<input %s>' % self.html_params(name=field.name, **kwargs))
		templateFragment = app.jinja_env.get_template('pwi/fragments/autocomplete_widget.html')
		return HTMLString(templateFragment.render(inputField=inputField,choices=field.choices,fieldID=field.id,minLength=1))

class AutoCompleteField(TextField):
	def __init__(self, label='', validators=None, choices=[], **kwargs):
		super(TextField, self).__init__(label, validators, **kwargs)
		if choices:
			self.choicemap = {}
			# check if we have tuples or lists
			# choices can optionally be a tuple list like [(1,"choice 1"),(2,"choice 2")]
			# this replicates behavior similar to the SelectField or MultipleSelectField
			if type(choices[0]) is list or type(choices[0]) is tuple:
				self.choices = []
				for value,choice in choices:
					self.choicemap[choice] = value
					self.choices.append(choice)
			else:
				for choice in choices:
					self.choicemap[choice] = choice
				self.choices = choices

	widget=AutoCompleteWidget()
	
	def process_formdata(self,value):
		if value:
			if type(value) is list or type(value) is tuple:
				value = value[0]
			if value and value in self.choicemap:
				self.data=self.choicemap[value]
			else:
				self.data=value
		else:
		    self.data=value

