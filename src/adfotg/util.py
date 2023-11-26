class Interpretable:
    '''Mixin for Enums, interprets value either directly
    as the Enum instance or as Enum.value.
    '''
    @classmethod
    def interpret(cls, o):
        try:
            if o in cls:
                return o
        except TypeError:
            pass
        return cls(o)
