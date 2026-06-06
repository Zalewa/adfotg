class Interpretable:
    '''Mixin for Enums, interprets value either directly
    as the Enum instance or as Enum.value.
    '''
    @classmethod
    def interpret(cls, o):
        if type(o) == cls:
            return o
        return cls(o)
