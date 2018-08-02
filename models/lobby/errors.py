class DuplicateUsername(ValueError):
    """ This is a DOC string """
    def __init__(self, message):
        #passing message to super class
        super().__init__(f'Error code {message}')
        self.message = message
